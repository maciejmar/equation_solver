import { Component,OnInit } from '@angular/core';

import { FormBuilder, FormGroup, FormArray,  FormControl, AbstractControl,  Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { ApiService } from '../api.service';
@Component({
  selector: 'app-matrix',
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.scss']
})

export class MatrixComponent implements OnInit {
 
  degreeForm!: FormGroup;
  degree:number=0; 
  
  matrixForm!: FormGroup;
  rows = Array(4);
  cols = Array(4);
  results  = Array(4);

 // ordinatesForm!: FormGroup;
  
  profileForm = this.formb.group({
    degree: [''],
  });

  matrixform: FormGroup = this.formb.group({
    row: this.formb.array([])
});

 ordinatesForm: FormGroup = this.formbOrdinates.group({
  row: this.formbOrdinates.array([])
 })


  constructor(private fb: FormBuilder, private fbuilder:FormBuilder,  private formb: FormBuilder, private formbOrdinates: FormBuilder,
     private apiService: ApiService) {
    
  }

  n:number = 0  
  ngOnInit(): void {
    this.degreeForm = this.fb.group({
      degree: [this.degree, Validators.required]
    });

    this.profileForm = this.fb.group({
      degree: ['']
    });


    this.matrixForm = this.formb.group({});
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
          const controlName = `cell${i}_${j}`;
          this.matrixForm.addControl(controlName, new FormControl('', [
              Validators.required,
              Validators.pattern(/^-?\d+(\.\d+)?$/),// Only numeric values alowed 
              this.expressionValidator() 
          ]));
      }
  }

    this.ordinatesForm = this.formb.group({});
    for (let i = 0; i < 4; i++) {
      {
        this.ordinatesForm.addControl('ordin' + i , new FormControl(''));
      }
    }

  }
  

    onSubmit1(): void {
      const formData = this.profileForm.value;
      this.apiService.postDegreeData(formData).subscribe({
        next:response => console.log('ResponseDegree:', response),
        error: error => console.error('Error:', error)
      });
    }

    submitMatrixForm():void {
      if (this.matrixForm.valid) {
        // Proceed with submission
      } else {
        // Handle invalid form, e.g., by marking all fields as touched to show errors
        this.matrixForm.markAllAsTouched();
        console.log('Invalid matrix');
      }
      const matrixData = this.matrixForm.value;
      console.log(this.matrixForm.value);
      if (this.matrixForm.valid) {
        // Process the valid form data
        this.apiService.postMatrixData(matrixData).subscribe({
          next: response => console.log('ResponseMatrix:', response),
          error: error => {
            console.log('error in submiting matrix -', error);
            this.matrixForm.setErrors({ 'backend': error.error.error });
          }
        });
      } 
      else {    
         this.matrixForm.markAllAsTouched();
         console.log('Invalid matrix');
      }
    }

    submitOrdinatesForm():void {
        const ordinatesData = this.ordinatesForm.value;
        console.log(this.ordinatesForm.value);
        this.apiService.postOrdinatesData(ordinatesData).subscribe({
           next: response => { 
                               console.log('ResponseOrdinates:', response.solution);
                               this.results = [...response.solution];
                            },
                           
           error: error => console.error('Error:', error)
        })
    }
    
    safeEvaluate(expression: string): number | null {
      try {
        // Placeholder for safe evaluation logic
        // e.g., using math.js: return math.evaluate(expression);
        return eval(expression); // Note: Using eval() as a placeholder, not recommended for production
      } catch {
        return null; // Indicate failure to evaluate
      }
    }

    expressionValidator(): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
        const result = this.safeEvaluate(control.value); // Use the safe evaluation function
        if (result === null || isNaN(result)) {
          return { 'expressionInvalid': true };
        }
        return null; // If the expression is valid and evaluates to a number
      };
    }

    onFieldBlur(controlName: string): void {
      const control = this.matrixForm.get(controlName);
      if (control && !control.valid) {
        // The control is invalid after the user leaves the field
        // Here, you can implement any logic you need to signal the error to the user
        // For example, you could set a flag to show an error message next to the field
      }
    }
         

}

