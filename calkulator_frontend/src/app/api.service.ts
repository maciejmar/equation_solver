import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  apiUrl = 'http://localhost:8001/calculator/solve/';  // URL of my Django API

  constructor(private http: HttpClient) { }

  getSolverData() {
    return this.http.get<any>(`${this.apiUrl}/calculator/solve/`);
  }

  postMatrixData(matrixData: any) {
    return this.http.post<any>('http://localhost:8001/calculator/equation_solver/', matrixData);
  }

  postDegreeData(degreeData: any) {
     return this.http.post<any> (`http://localhost:8001/calculator/another_post/`, degreeData); //(`${this.apiUrl}another_post/`, degreeData);
  }

  postOrdinatesData(ordinatesData: any) {
    return this.http.post<any> (`http://localhost:8001/calculator/ordinates/`, ordinatesData); //(`${this.apiUrl}ordinates/`, ordinatesData);
 }

  
  
}