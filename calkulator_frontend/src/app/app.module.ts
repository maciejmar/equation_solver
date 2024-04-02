import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EquationSolverComponent } from './equation-solver/equation-solver.component';
import { ReactiveFormsModule } from '@angular/forms'; // Import here
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { ApiService } from './api.service';
import { MatrixComponent } from './matrix/matrix.component';
import { NavComponent } from './nav/nav.component'; // Your API service
import { FormsModule } from '@angular/forms';


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
    HttpClientXsrfModule.withOptions({
      cookieName: 'csrftoken', 
      headerName: 'X-CSRFToken', 
    }),
    FormsModule,
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
