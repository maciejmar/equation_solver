import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  //apiUrl = 'http://localhost:8001/calculator/solve/';  // URL of my Django API

  apiUrl = environment.apiUrl;
  apiAnotherUrl = environment.apiAnotherUrl;
  apiOrdinatesUrl = environment.apiOrdinatesUrl;
  constructor(private http: HttpClient) { }

  getSolverData() {
    return this.http.get<any>(`${this.apiUrl}`);
  }

  postMatrixData(matrixData: any) {
    return this.http.post<any>( this.apiUrl, matrixData );
  }

  postDegreeData(degreeData: any) {
     return this.http.post<any> ( this.apiAnotherUrl, degreeData ); //(`${this.apiUrl}another_post/`, degreeData);
  }

  postOrdinatesData(ordinatesData: any) {
    return this.http.post<any> ( this.apiOrdinatesUrl, ordinatesData ); //(`${this.apiUrl}ordinates/`, ordinatesData);
 }

  
  
}