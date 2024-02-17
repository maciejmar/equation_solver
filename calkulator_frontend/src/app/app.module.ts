import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EquationSolverComponent } from './equation-solver/equation-solver.component';
import { ReactiveFormsModule } from '@angular/forms'; // Import here
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from './api.service';
import { MatrixComponent } from './matrix/matrix.component';
import { NavComponent } from './nav/nav.component'; // Your API service


@NgModule({
  declarations: [
    AppComponent,
    EquationSolverComponent,
    MatrixComponent,
    NavComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule, 
    HttpClientModule,
    
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
