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
  degree!:number; 
  minSize=2;
  maxSize=7;
  matrixForm!: FormGroup;
  rows:number[] = [];
  cols:number[] = [];
  results:number[]  = []
  okToCompleteOrdinatesForm:boolean = false;
  okToCompleteMatrixForm:boolean = true;
  matrixSingular:boolean = false;

 // ordinatesForm!: FormGroup;
  
  profileForm = this.formb.group({
    degree: [''],
  });

//   matrixform: FormGroup = this.formb.group({
//     row: this.formb.array([])
// });

 ordinatesForm: FormGroup = this.formbOrdinates.group({
  row: this.formbOrdinates.array([])
 })


  constructor(private fb: FormBuilder, private fbuilder:FormBuilder,  private formb: FormBuilder, private formbOrdinates: FormBuilder,
     private apiService: ApiService) {
    
  }

   
  ngOnInit(): void {
    this.ordinatesForm.invalid;
    this.degreeForm = this.fb.group({
      degree: [this.degree, 
               Validators.required,
               this.degreeValidator()]
    });

    this.profileForm = this.fb.group({
      degree: ['']
    });


    this.matrixForm = this.formb.group({});
    for (let i = 0; i < this.degree; i++) {
      for (let j = 0; j < this.degree; j++) {
          const controlName = `cell${i}_${j}`;
          this.matrixForm.addControl(controlName, new FormControl('', [
              Validators.required,
              Validators.pattern(/^-?\d+(\.\d+)?$/),// Only numeric values alowed 
              this.expressionValidator() 
          ]));
      }
  }

    this.ordinatesForm = this.formb.group({});
    for (let i = 0; i < this.degree; i++) {
      {
        this.ordinatesForm.addControl('ordin' + i , new FormControl(''));
      }
    }

    this.matrixForm.valueChanges.subscribe(() => {  
      //if(this.okToCompleteMatrixForm && !this.okToCompleteOrdinatesForm)
        this.okToCompleteOrdinatesForm = false;
    });

  }
    
  private updateMatrixSize(degree: number): void {
    this.rows = Array.from({length: degree}, (_, i) => i);
    this.cols = Array.from({length: degree}, (_, i) => i);
  
    // Reset and rebuild the matrix form based on new degree
    this.matrixForm = this.formb.group({});
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < degree; j++) {
        this.matrixForm.addControl(`cell${i}_${j}`, new FormControl('', [
          Validators.required,
          Validators.pattern(/^-?\d+(\.\d+)?$/),
          this.expressionValidator()
        ]));
      }
    }
  }
  
  private updateOrdinatesSize(degree: number): void {
    // Reset and rebuild the ordinates form based on new degree
    this.ordinatesForm = this.formb.group({});
    for (let i = 0; i < degree; i++) {
      this.ordinatesForm.addControl(`ordin${i}`, new FormControl('', Validators.required));
    }
  }

    // onSubmit1(): void {
    //   const formData = this.profileForm.value;
    //   this.apiService.postDegreeData(formData).subscribe({
    //     next:response => console.log('ResponseDegree:', response),
    //     error: error => console.error('Error:', error)
    //   });
    // }

    onSubmit1(): void {
      // Extract the degree directly from the form control.
      const degreeControl = this.profileForm.get('degree');
      const newDegree = degreeControl ? +degreeControl.value! : 0;
      if (newDegree >= this.minSize && newDegree <= this.maxSize)  {
        this.degree = newDegree;
        this.updateMatrixSize(newDegree);
        this.updateOrdinatesSize(newDegree);
      }
    }

    submitMatrixForm():void {
      if (this.matrixForm.valid) {
        // Proceed with submission
        this.matrixSingular = false;
      } else {
        // Handle invalid form, e.g., by marking all fields as touched to show errors
        this.matrixForm.markAllAsTouched();
        console.log('Invalid matrix');
      }
      const matrixData = this.matrixForm.value;
      console.log(this.matrixForm.value);
      if (this.matrixForm.valid) {
        this.matrixForm.disable();
        this.okToCompleteOrdinatesForm = true;
        this.okToCompleteMatrixForm = false;
        // Process the valid form data
        this.apiService.postMatrixData(matrixData).subscribe({
          next: response => console.log('ResponseMatrix:', response),
          error: error => {
            console.log('error in submiting matrix -', error);
            if (error.error && error.error.error === 'Matrix is singular, cannot proceed') {
              // If the error is specifically because the matrix is singular
              this.matrixForm.setErrors({ 'singularMatrix': 'Matrix is singular, cannot proceed' });
              this.matrixSingular = true;
              //this.okToCompleteOrdinatesForm = false;
            } 
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
        if (this.ordinatesForm.valid && this.okToCompleteOrdinatesForm){
          this.matrixForm.enable();
          this.okToCompleteOrdinatesForm = false;
          this.okToCompleteMatrixForm = true;
        }
        console.log('ordinates in submitOrdinatesForm = ', this.ordinatesForm.value);
        console.log('matrix in submitOrdinatesForm = ', this.matrixForm.value);
        if (this.matrixForm.errors?.['singularMatrix']) this.okToCompleteMatrixForm = true;
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

    degreeValidator(): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
        const result = control.value;
        if (result < this.minSize || result > this.maxSize ){
          return {'expressionInvalid' : true}
        }
        return null;
      }
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

