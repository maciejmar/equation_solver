import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquationSolverComponent } from './equation-solver.component';

describe('EquationSolverComponent', () => {
  let component: EquationSolverComponent;
  let fixture: ComponentFixture<EquationSolverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
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
