import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl  } from '@angular/forms';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-equation-solver',
  templateUrl: './equation-solver.component.html',
  styleUrls: ['./equation-solver.component.scss']
})

export class EquationSolverComponent {
  equationForm!: FormGroup;
  n: number = 0;
  maxN: number = 6;
  coefficients!: number[][];

 


  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.equationForm = this.fb.group({
      n: ['', [Validators.required, Validators.min(1), Validators.max(this.maxN)]],
      equations: this.fb.array([])
    });
  
    // Add the value change listener
    this.equationForm.valueChanges.subscribe(value => {
      console.log("Form Value Changed: ", value);
    });
  }

onNChange() {
  const nValue = this.equationForm.get('n')!.value;
  this.n = nValue;
  this.buildEquationsForm(nValue);
  console.log("Form after n change:", this.equationForm.value);
}

buildEquationsForm(n: number) {
  const equationsFormArray = this.equationForm.get('equations') as FormArray;
  equationsFormArray.clear();

  for (let i = 0; i < n; i++) {
    const coefficients = this.fb.array(new Array(n).fill(null).map(() => this.fb.control(0)));
    const equationFormGroup = this.fb.group({
      coefficients: coefficients,
      intercept: this.fb.control(0)
    });
    equationsFormArray.push(equationFormGroup);
  }


  
}



get equationsFormArray() {
  return this.equationForm.get('equations') as FormArray;
}


getControls(equationGroup: AbstractControl): AbstractControl[] {
  return (equationGroup.get('coefficients') as FormArray).controls;
}

onSubmit() {
  console.log("Submitted Form Value: ", this.equationForm.value);
}

}

