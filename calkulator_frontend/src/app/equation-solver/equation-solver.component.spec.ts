import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { EquationSolverComponent } from './equation-solver.component';

describe('EquationSolverComponent', () => {
  let component: EquationSolverComponent;
  let fixture: ComponentFixture<EquationSolverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule, HttpClientTestingModule, ReactiveFormsModule],
      declarations: [EquationSolverComponent]
    });
    fixture = TestBed.createComponent(EquationSolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
