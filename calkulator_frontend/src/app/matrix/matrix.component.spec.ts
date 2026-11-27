import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

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
});
