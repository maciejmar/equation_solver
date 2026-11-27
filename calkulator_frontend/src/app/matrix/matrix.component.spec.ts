import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { MatrixComponent } from './matrix.component';
import { ApiService } from '../api.service';

describe('MatrixComponent', () => {
  let component: MatrixComponent;
  let fixture: ComponentFixture<MatrixComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', ['postMatrixData', 'postOrdinatesData']);
    apiService.postOrdinatesData.and.returnValue(of({ solution: [2, 1] }));

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [MatrixComponent],
      providers: [{ provide: ApiService, useValue: apiService }]
    }).compileComponents();

    fixture = TestBed.createComponent(MatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sends the current matrix with the ordinates to the solver', () => {
    component.profileForm.get('degree')?.setValue(2);
    component.onSubmit1();
    component.matrixForm.setValue({
      cell0_0: '2',
      cell0_1: '1',
      cell1_0: '1',
      cell1_1: '-1'
    });
    component.ordinatesForm.setValue({ ordin0: '5', ordin1: '1' });
    component.okToCompleteOrdinatesForm = true;

    component.submitOrdinatesForm();

    expect(apiService.postOrdinatesData).toHaveBeenCalledWith({
      matrix: [[2, 1], [1, -1]],
      ordin0: 5,
      ordin1: 1
    });
  });

  it('renders one solution card and one Solve next button', () => {
    component.showEditor = false;
    component.results = [2, 1];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.solution-title').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.solution-row').length).toBe(2);
    const solveNextButtons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(Array.from(solveNextButtons).filter(button => button.textContent?.trim() === 'Solve next').length).toBe(1);
  });

  it('asks for a new matrix and blocks solving when the matrix is singular', () => {
    component.profileForm.get('degree')?.setValue(2);
    component.onSubmit1();
    component.matrixForm.setValue({
      cell0_0: '1',
      cell0_1: '2',
      cell1_0: '2',
      cell1_1: '4'
    });
    component.matrixForm.markAsDirty();
    component.ordinatesForm.setValue({ ordin0: '3', ordin1: '6' });
    component.ordinatesForm.markAsDirty();
    apiService.postMatrixData.and.returnValue(throwError(() => ({
      error: { error: 'Matrix is singular, cannot proceed' }
    })));

    component.submitMatrixForm();
    fixture.detectChanges();

    expect(component.matrixSingular).toBeTrue();
    expect(component.matrixForm.enabled).toBeTrue();
    expect(component.okToCompleteOrdinatesForm).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('This matrix is singular. Change the matrix and submit it again.');
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    );
    expect(buttons.filter(button => button.textContent?.trim() === 'See result').length).toBe(0);

    const submitMatrixButton = buttons.find(button => button.textContent?.trim() === 'Submit matrix');
    expect(submitMatrixButton).toBeDefined();
    expect(submitMatrixButton?.disabled).toBeTrue();

    component.submitMatrixForm();
    expect(apiService.postMatrixData).toHaveBeenCalledTimes(1);

    component.matrixForm.get('cell0_0')?.setValue('1.5');
    fixture.detectChanges();
    expect(submitMatrixButton?.disabled).toBeFalse();

    component.matrixForm.get('cell0_0')?.setValue('1');
    fixture.detectChanges();
    expect(submitMatrixButton?.disabled).toBeTrue();

    component.submitOrdinatesForm();
    expect(apiService.postOrdinatesData).not.toHaveBeenCalled();
  });
});
