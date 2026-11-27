import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewInit,  ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray,  FormControl, AbstractControl,  Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { ApiService } from '../api.service';

import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions } from '@capacitor-community/admob';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-matrix',
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.scss']
})

export class MatrixComponent implements OnInit {
  degree = 3;
  minSize = 2;
  maxSize = 7;
  isSolving = false;
  @ViewChild('eqPreview') private eqPreview!: ElementRef<HTMLElement>;
  equationFontPx = 16;            // bieżący rozmiar czcionki w podglądzie
  private eqBaseFontPx = 16;      // bazowy rozmiar od którego startujemy
  private eqMinFontPx  = 11;      // minimalny rozmiar na bardzo małych ekranach
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lastPlay = 0;
  showEditor = true;

blinkCell: string | null = null;
private blinkTimer?: any;
  rows: number[] = [];
  cols: number[] = [];

  // --- formularze (zachowane nazwy) ---
  profileForm!: FormGroup;
  matrixForm!: FormGroup;
  ordinatesForm!: FormGroup;

  // --- podgląd aktywnej komórki (zachowane nazwy) ---
  showPreview = false;
  previewValue = '';
  previewPositionX = 0;
  previewPositionY = 0;
  private previewTimeout: any;

  // --- status obliczeń (zachowane nazwy) ---
  results: number[] = [];
  matrixSingular = false;
  okToCompleteMatrixForm = false;
  okToCompleteOrdinatesForm = false;
  // --- walidacja w locie + animacja pulsowania ---
  private numericRe = /^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)$/; // -3, 3., .5, 3.14, +7
  invalidBlink = new Set<string>();
  pasteStatus = '';
  private pasteStatusTimer?: ReturnType<typeof setTimeout>;

  @ViewChild('matrixWrap', { static: true })
  private matrixWrap!: ElementRef<HTMLElement>;
  @ViewChild('matrixGrid')
  private matrixGrid?: ElementRef<HTMLElement>;
  constructor(private fb: FormBuilder, private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // formularz stopnia
    this.profileForm = this.fb.group({
      degree: [this.degree, [Validators.required, Validators.min(this.minSize), Validators.max(this.maxSize)]],
    });

    // puste formularze na start
    this.matrixForm = this.fb.group({});
    this.ordinatesForm = this.fb.group({});

    // inicjalizacja macierzy
    this.buildGrid(this.degree);
  }

  ngAfterViewInit(): void {
    this.recalcEquationsFont();   // po pierwszym wyrenderowaniu
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.recalcEquationsFont();
  }


  // --- budowa siatki i kontrolek ---
  private buildGrid(n: number): void {
    n = Math.max(this.minSize, Math.min(this.maxSize, Number(n) || this.degree));
    this.degree = n;

    // rzędy/kolumny
    this.rows = Array.from({ length: n }, (_, i) => i);
    this.cols = Array.from({ length: n }, (_, j) => j);

    // wyczyść kontrolki i zbuduj od nowa
    const groupCells: { [k: string]: FormControl } = {};
    const groupOrdin: { [k: string]: FormControl } = {};

    for (let i = 0; i < n; i++) {
      groupOrdin[`ordin${i}`] = new FormControl('', [
        Validators.required,
        Validators.pattern(this.numericRe),
      ]);
      for (let j = 0; j < n; j++) {
        groupCells[`cell${i}_${j}`] = new FormControl('', [
          Validators.required,
          Validators.pattern(this.numericRe),
        ]);
      }
      setTimeout(() => this.recalcEquationsFont());
    }

    this.matrixForm = this.fb.group(groupCells);
    this.ordinatesForm = this.fb.group(groupOrdin);
  }

  // --- obsługa formularza stopnia ---
  onSubmit1(): void {
    const val = Number(this.profileForm.get('degree')?.value);
    if (isFinite(val) && val >= this.minSize && val <= this.maxSize) {
      this.buildGrid(val);
      this.focusGridCell(0, 0);
      return;
    }

    this.profileForm.markAllAsTouched();
  }

  selectFieldContent(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    setTimeout(() => input.select());
  }

  onNumericInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const normalized = this.normalizeNumericText(input.value);
    const control = this.matrixForm.get(controlName) ?? this.ordinatesForm.get(controlName);

    if (normalized !== input.value) input.value = normalized;
    if (control && control.value !== normalized) {
      control.setValue(normalized, { emitEvent: false });
      control.markAsDirty();
      control.updateValueAndValidity({ emitEvent: false });
    }

    this.updatePreview(event, controlName);
  }

  onGridKeydown(event: KeyboardEvent, row: number, column: number): void {
    const width = this.cols.length + 1;
    let nextRow = row;
    let nextColumn = column;

    switch (event.key) {
      case 'Enter':
        if (event.shiftKey) {
          nextColumn--;
          if (nextColumn < 0) {
            nextRow--;
            nextColumn = width - 1;
          }
        } else {
          nextColumn++;
          if (nextColumn >= width) {
            nextRow++;
            nextColumn = 0;
          }
        }
        break;
      case 'ArrowUp':
        nextRow--;
        break;
      case 'ArrowDown':
        nextRow++;
        break;
      case 'ArrowLeft':
        if (!this.isCaretAtEdge(event.target, 'start')) return;
        nextColumn--;
        if (nextColumn < 0) {
          nextRow--;
          nextColumn = width - 1;
        }
        break;
      case 'ArrowRight':
        if (!this.isCaretAtEdge(event.target, 'end')) return;
        nextColumn++;
        if (nextColumn >= width) {
          nextRow++;
          nextColumn = 0;
        }
        break;
      default:
        return;
    }

    if (nextRow < 0 || nextRow >= this.rows.length) return;
    event.preventDefault();
    this.focusGridCell(nextRow, nextColumn);
  }

  onGridPaste(event: ClipboardEvent, startRow: number, startColumn: number): void {
    const text = event.clipboardData?.getData('text')?.trim();
    if (!text) return;

    const pastedRows = text
      .split(/\r?\n/)
      .map(line => line.trim().split(/(?:\t|;|\s)+/).filter(Boolean));
    const tokenCount = pastedRows.reduce((sum, row) => sum + row.length, 0);
    if (tokenCount < 2) return;

    event.preventDefault();
    const width = this.cols.length + 1;
    let applied = 0;
    let lastRow = startRow;
    let lastColumn = startColumn;

    const setCell = (row: number, column: number, rawValue: string) => {
      if (row >= this.rows.length || column >= width) return;
      const value = this.normalizeNumericText(rawValue);
      if (!this.numericRe.test(value)) return;

      const control = column === this.cols.length
        ? this.ordinatesForm.get(`ordin${row}`)
        : this.matrixForm.get(`cell${row}_${column}`);
      if (!control || control.disabled) return;

      control.setValue(value);
      control.markAsDirty();
      control.updateValueAndValidity({ emitEvent: false });
      applied++;
      lastRow = row;
      lastColumn = column;
    };

    if (pastedRows.length === 1) {
      let row = startRow;
      let column = startColumn;
      for (const token of pastedRows[0]) {
        setCell(row, column, token);
        column++;
        if (column >= width) {
          row++;
          column = 0;
        }
      }
    } else {
      pastedRows.forEach((values, rowOffset) => {
        values.forEach((value, columnOffset) => {
          setCell(startRow + rowOffset, startColumn + columnOffset, value);
        });
      });
    }

    this.showPasteStatus(applied ? `Wklejono ${applied} wartości` : 'Nie znaleziono poprawnych liczb');
    if (applied) this.focusGridCell(lastRow, lastColumn);
    this.recalcEquationsFont();
  }

  fillEmptyWithZeros(): void {
    [...Object.values(this.matrixForm.controls), ...Object.values(this.ordinatesForm.controls)]
      .filter(control => control.enabled && String(control.value ?? '').trim() === '')
      .forEach(control => {
        control.setValue('0');
        control.markAsDirty();
      });
    this.recalcEquationsFont();
  }

  clearGrid(): void {
    this.matrixForm.enable();
    this.matrixForm.reset();
    this.ordinatesForm.reset();
    this.okToCompleteMatrixForm = false;
    this.okToCompleteOrdinatesForm = false;
    this.matrixSingular = false;
    this.pasteStatus = '';
    this.focusGridCell(0, 0);
  }

  private normalizeNumericText(value: string): string {
    return value.trim().replace(/,/g, '.');
  }

  private isCaretAtEdge(target: EventTarget | null, edge: 'start' | 'end'): boolean {
    const input = target as HTMLInputElement | null;
    if (!input) return true;
    return edge === 'start'
      ? input.selectionStart === 0 && input.selectionEnd === 0
      : input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
  }

  private focusGridCell(row: number, column: number): void {
    setTimeout(() => {
      const grid = this.matrixGrid?.nativeElement;
      const input = grid?.querySelector<HTMLInputElement>(
        `[data-grid-row="${row}"][data-grid-col="${column}"]`
      );
      input?.focus();
      input?.select();
    });
  }

  private showPasteStatus(message: string): void {
    this.pasteStatus = message;
    clearTimeout(this.pasteStatusTimer);
    this.pasteStatusTimer = setTimeout(() => (this.pasteStatus = ''), 2500);
  }

  // --- podgląd aktywnej komórki ---
  showCellPreview(event: FocusEvent, fieldName: string, value: any): void {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.showPreview = true;
    this.previewValue = (value ?? '').toString();
    this.previewPositionX = rect.left + window.scrollX - 10;
    this.previewPositionY = rect.top + window.scrollY - 60;

    clearTimeout(this.previewTimeout);
    this.previewTimeout = setTimeout(() => this.hidePreviewOnly(), 3000);
  }

  updatePreview(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    this.previewValue = input.value;
    this.showPreview = this.previewValue.trim() !== '';

    const rect = input.getBoundingClientRect();
    this.previewPositionX = rect.left + window.scrollX - 10;
    this.previewPositionY = rect.top + window.scrollY - 60;

    clearTimeout(this.previewTimeout);
    this.previewTimeout = setTimeout(() => this.hidePreviewOnly(), 3000);
    this.recalcEquationsFont();
  }

  hidePreviewOnly(): void {
    this.showPreview = false;
  }

  // --- focus wychodzi poza cały grid => chowamy preview ---
  // Chowamy podgląd tylko gdy fokus wychodzi poza cały grid:
onContainerFocusOut(ev: FocusEvent): void {
  const next = ev.relatedTarget as HTMLElement | null;
  const wrap = this.matrixWrap?.nativeElement;
  if (!wrap || !next || !wrap.contains(next)) {
    this.hidePreviewOnly(); // Twoja istniejąca metoda
  }
}

// Krótkie "pulsowanie" po blurze błędnej komórki
afterBlur(name: string): void {
  const c: AbstractControl | null =
    this.matrixForm.get(name) || this.ordinatesForm.get(name);
  if (c && c.touched && c.invalid) {
    this.blinkCell = null;
    clearTimeout(this.blinkTimer);
    setTimeout(() => {
      this.blinkCell = name;
      this.blinkTimer = setTimeout(() => (this.blinkCell = null), 900);
    }, 0);
  }
}

  // --- walidacja na blur + puls ---
  onFieldBlur(controlName: string): void {
    const control =
      (this.matrixForm.get(controlName) as AbstractControl | null) ??
      (this.ordinatesForm.get(controlName) as AbstractControl | null);

    if (!control) return;

    const val = String(control.value ?? '').trim();
    const ok = val !== '' && this.numericRe.test(val);

    if (!ok) {
      const errs = { ...(control.errors || {}) };
      errs['pattern'] = true;
      errs['expressionInvalid'] = true;
      control.setErrors(errs);
      control.markAsTouched();
      this.triggerBlink(controlName);
    } else {
      const errs = { ...(control.errors || {}) };
      delete errs['pattern'];
      delete errs['expressionInvalid'];
      control.setErrors(Object.keys(errs).length ? errs : null);
    }
  }

  isInvalid(name: string): boolean {
    const ctrl =
      (this.matrixForm?.get(name) as AbstractControl | null) ??
      (this.ordinatesForm?.get(name) as AbstractControl | null);
    return !!(ctrl && ctrl.touched && ctrl.invalid);
  }

  shouldBlink(name: string): boolean {
    return this.invalidBlink.has(name);
  }

  private triggerBlink(name: string) {
    this.invalidBlink.delete(name);
    this.invalidBlink.add(name);
    setTimeout(() => this.invalidBlink.delete(name), 900);
  }

  // --- przyciski akcji: podstawki (Twoja logika może je nadpisać/uzupełnić) ---
 submitMatrixForm(): void {
  const matrixData = this.matrixForm.value;

  // zamiana stringów na number (tak masz w oryginale)
  Object.keys(matrixData).forEach(key => {
    matrixData[key] = matrixData[key] !== '' ? parseFloat(matrixData[key]) : null;
  });

  console.log('Processed matrix data:', matrixData);

  if (this.matrixForm.valid) {
    this.matrixSingular = false;
    this.matrixForm.disable();
    this.okToCompleteOrdinatesForm = false;
    this.okToCompleteMatrixForm = false;

    // WYWOŁANIE BACKENDU
    this.apiService.postMatrixData(matrixData).subscribe({
      next: (response) => {
        console.log('ResponseMatrix:', response);
        // brak błędu => zdejmij ewentualne error-y
        const errs = { ...(this.matrixForm.errors || {}) };
        delete errs['singularMatrix'];
        delete errs['backend'];
        this.matrixForm.setErrors(Object.keys(errs).length ? errs : null);
        this.matrixSingular = false;
        this.okToCompleteOrdinatesForm = true;
      },
      error: (error) => {
        console.log('error in submitting matrix -', error);
        if (error?.error && error.error.error === 'Matrix is singular, cannot proceed') {
          this.handleSingularMatrixError();
          return;
        }
        // ogólny błąd backendu na formularzu
        this.matrixForm.setErrors({ backend: error?.error?.error || 'Backend error' });
      }
    });
  } else {
    this.matrixForm.markAllAsTouched();
    console.log('Invalid matrix');
  }
}

private handleSingularMatrixError(): void {
  this.matrixForm.enable();
  this.ordinatesForm.enable();
  this.matrixForm.setErrors(null);
  this.matrixSingular = true;
  this.okToCompleteOrdinatesForm = false;
  this.okToCompleteMatrixForm = true;
  this.results = [];
  this.isSolving = false;
  this.showEditor = true;
  this.cdr.detectChanges();
}

  submitOrdinatesForm(): void {
  const matrix = this.getMatrixFromForm();
  const ordinates = this.getVectorFromForm();

  if (this.matrixSingular || !this.ordinatesForm.valid || !this.okToCompleteOrdinatesForm || matrix === null || ordinates === null) {
    this.matrixForm.markAllAsTouched();
    this.ordinatesForm.markAllAsTouched();
    return;
  }

  const ordinatesData: any = { matrix };
  ordinates.forEach((value, index) => {
    ordinatesData[`ordin${index}`] = value;
  });

  this.matrixForm.enable();
  this.okToCompleteOrdinatesForm = false;
  this.okToCompleteMatrixForm = true;

  this.isSolving = true;
  this.showEditor = false;
  this.results = [];
  this.cdr.detectChanges();

  this.apiService.postOrdinatesData(ordinatesData).subscribe({
    next: (response) => {
      console.log('ResponseOrdinates:', response);
      this.results = this.extractSolution(response);
      this.isSolving = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Ordinates submit error:', error);
      if (error?.error?.error === 'Matrix is singular, cannot proceed') {
        this.handleSingularMatrixError();
        return;
      }
      const errs = { ...(this.matrixForm.errors || {}) };
      errs['backend'] = error?.error?.error || 'Backend error';
      this.matrixForm.setErrors(errs);

      // wróć do edytora, skoro się nie udało
      this.isSolving = false;
      this.showEditor = true;
      this.cdr.detectChanges();
    }
  });
}



  // zczytaj A z matrixForm ➜ double[][]; jeśli trafi się nienumer, zwraca null i zaznacza błąd na kontrolce
private getMatrixFromForm(): number[][] | null {
  const n = this.cols?.length ?? this.degree ?? 0;
  if (!n) return null;

  const A: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const name = `cell${i}_${j}`;
      const ctrl = this.matrixForm.get(name) as AbstractControl | null;
      const v = String(ctrl?.value ?? '').trim();
      const x = v === '' ? NaN : Number(v);
      if (!isFinite(x)) {
        ctrl?.setErrors({ ...(ctrl.errors || {}), pattern: true, expressionInvalid: true });
        ctrl?.markAsTouched();
        return null;
      }
      A[i][j] = x;
    }
  }
  return A;
}

// zczytaj b z ordinatesForm ➜ double[]; analogicznie waliduje
private getVectorFromForm(): number[] | null {
  const n = this.rows?.length ?? this.degree ?? 0;
  if (!n) return null;

  const b: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const name = `ordin${i}`;
    const ctrl = this.ordinatesForm.get(name) as AbstractControl | null;
    const v = String(ctrl?.value ?? '').trim();
    const x = v === '' ? NaN : Number(v);
    if (!isFinite(x)) {
      ctrl?.setErrors({ ...(ctrl.errors || {}), pattern: true, expressionInvalid: true });
      ctrl?.markAsTouched();
      return null;
    }
    b[i] = x;
  }
  return b;
}
private isSingular(A: number[][], eps = 1e-10): boolean {
  const n = A.length;
  // kopia, żeby nie modyfikować form
  const M = A.map(row => row.slice());

  for (let k = 0; k < n; k++) {
    // pivot z częściowym wyborem
    let piv = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > Math.abs(M[piv][k])) piv = i;
    }
    if (Math.abs(M[piv][k]) < eps) return true; // zbyt mały pivot ➜ osobliwa

    if (piv !== k) [M[k], M[piv]] = [M[piv], M[k]];

    // eliminacja
    for (let i = k + 1; i < n; i++) {
      const f = M[i][k] / M[k][k];
      for (let j = k; j < n; j++) M[i][j] -= f * M[k][j];
    }
  }
  return false;
}

// stan przycisku + bąbelki
isEnterPressed = false;
bubbles: Array<{ id: number; x: number; y: number; dx: number; dy: number; scale: number }> = [];
private _bubbleId = 0;

onEnterDown(_evt: Event) {
  this.isEnterPressed = true;
}
onEnterUp() {
  this.isEnterPressed = false;
}


popBubbles(evt: MouseEvent | TouchEvent) {
  const target = evt.currentTarget as HTMLElement | null;
  if (!target) return;
  const rect = target.getBoundingClientRect();

  // pozycja startu (klik lub środek)
  const point =
    (evt as MouseEvent).clientX !== undefined
      ? { x: (evt as MouseEvent).clientX, y: (evt as MouseEvent).clientY }
      : (evt as TouchEvent).touches && (evt as TouchEvent).touches.length
      ? { x: (evt as TouchEvent).touches[0].clientX, y: (evt as TouchEvent).touches[0].clientY }
      : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

  const originX = point.x - rect.left;
  const originY = point.y - rect.top;

  const count = 6; // ile bąbelków
  for (let i = 0; i < count; i++) {
    const angle = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI / 1.5; // głównie w górę
    const dist = 26 + Math.random() * 22;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist; // zwykle ujemne (do góry)
    const scale = (0.75 + Math.random() * 0.6).toFixed(2);

    const id = ++this._bubbleId;
    this.bubbles.push({ id, x: originX, y: originY, dx, dy, scale: parseFloat(scale) });

    // usuń po animacji (600–750 ms)
    setTimeout(() => {
      this.bubbles = this.bubbles.filter(b => b.id !== id);
    }, 750);
  }
}

private ensureAudio(): AudioContext {
  // WebKit fallback
  const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;

  if (!this.audioCtx) {
    const ctx: AudioContext = new Ctx();
    this.audioCtx = ctx;

    const mg = ctx.createGain();
    mg.gain.value = 0.55;       // głośność globalna
    mg.connect(ctx.destination);
    this.masterGain = mg;
  }

  const ctx = this.audioCtx as AudioContext;

  // iOS/Safari: po pierwszym geście bywa 'suspended'
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}


playPressSound(): void {
  const now = performance.now();
  if (now - this.lastPlay < 60) return;   // mały throttle
  this.lastPlay = now;

  const ctx = this.ensureAudio();
  const mg = this.masterGain as GainNode; // po ensureAudio na pewno istnieje

  const t = ctx.currentTime;

  // obwiednia
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(0.28, t + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1700, t);

  env.connect(lp);
  lp.connect(mg);

  const o1 = ctx.createOscillator();
  o1.type = 'triangle';
  o1.frequency.setValueAtTime(420, t);
  o1.frequency.exponentialRampToValueAtTime(180, t + 0.18);
  o1.connect(env);

  const o2 = ctx.createOscillator();
  o2.type = 'square';
  o2.frequency.setValueAtTime(120, t);
  o2.frequency.exponentialRampToValueAtTime(95, t + 0.18);
  o2.connect(env);

  o1.start(t); o2.start(t);
  o1.stop(t + 0.2); o2.stop(t + 0.2);
}







  /** Dobiera equationFontPx tak, aby NAJDŁUŻSZY wiersz mieścił się w kontenerze w jednej linii. */
  private recalcEquationsFont(): void {
    const host = this.eqPreview?.nativeElement;
    if (!host) return;

    // 1) ustaw bazowy rozmiar i zmierz najdłuższy wiersz
    this.equationFontPx = this.eqBaseFontPx;

    // wymuś reflow po zmianie fontu
    void host.offsetWidth;

    const containerWidth = host.clientWidth;
    if (containerWidth <= 0) return;

    // znajdź wszystkie .eq-line
    const lines = Array.from(host.querySelectorAll<HTMLElement>('.eq-line'));
    if (lines.length === 0) return;

    // 2) znajdź maksymalny scrollWidth (najdłuższa linia)
    let maxLineWidth = 0;
    for (const line of lines) {
      // defensywnie wyczyść transform/scale (nie używamy ich, ale gdyby były)
      line.style.transform = '';
      maxLineWidth = Math.max(maxLineWidth, line.scrollWidth);
    }

    // 3) jeśli najdłuższy wiersz szerszy niż kontener — zmniejsz font
    if (maxLineWidth > containerWidth) {
      const ratio = containerWidth / maxLineWidth;   // [0..1]
      const nextSize = Math.max(this.eqMinFontPx, Math.floor(this.eqBaseFontPx * ratio));

      // bezpieczeństwo: nie skacz co 1px, tylko podbij lekko, by nie „pompowało”
      this.equationFontPx = nextSize;
    }
  }

  solveNext(): void {
  // przywróć stan do edycji
  this.results = [];
  this.matrixSingular = false;
  this.okToCompleteMatrixForm = false;
  this.okToCompleteOrdinatesForm = false;

  // odbuduj formularze dla bieżącego degree (lub wyzeruj, jak wolisz)
  this.buildGrid(this.degree);

  // upewnij się, że macierz znów edytowalna
  this.matrixForm.enable();
  this.ordinatesForm.enable();

  // wróć do trybu edycji
  this.showEditor = true;

  // opcjonalnie: fokus w pole degree albo w pierwszą komórkę
  // (załóżmy w pierwszą komórkę jeśli istnieje)
  setTimeout(() => {
    const first = document.querySelector<HTMLInputElement>('input[formcontrolname="cell0_0"]');
    first?.focus();
  }, 0);
}
private extractSolution(resp: any): number[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp.slice();
  if (Array.isArray(resp.solution)) return resp.solution.slice();
  if (Array.isArray(resp.results)) return resp.results.slice();
  if (typeof resp === 'object') {
    // czasem bywa { x: [..] } itp.
    for (const k of Object.keys(resp)) {
      const v = (resp as any)[k];
      if (Array.isArray(v) && v.every((x: any) => typeof x === 'number')) return v.slice();
    }
  }
  return [];
}


}
