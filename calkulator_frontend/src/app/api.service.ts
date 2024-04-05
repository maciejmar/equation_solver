import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private csrfToken: string | null = null;

  apiUrl = environment.apiUrl;
  apiAnotherUrl = environment.apiAnotherUrl;
  apiOrdinatesUrl = environment.apiOrdinatesUrl;
  apiCsrfUrl = environment.apiCsrfUrl;

  constructor(private http: HttpClient) { }

  //retrive CSRF token
  private fetchCsrfToken(): Observable<string> {
    if (this.csrfToken) {
      console.log('by fetching csrf token is - ', this.csrfToken);
      return of(this.csrfToken); // 'of' is from rxjs
    } else {
      // Ensure this URL is correct and points to your Django endpoint for CSRF token retrieval
      return this.http.get<{ csrfToken: string }>(`${environment.apiCsrfUrl}csrf/`,{ responseType:  'text' as 'json' }).pipe(
        map(response => {
          this.csrfToken = JSON.parse(response.csrfToken) as string;
          const token = JSON.parse(this.csrfToken)
          console.log('->', response)
          console.log('token ' , token)
          console.log('this csrf token in service=',this.csrfToken);
          
          return token;
        }),
        catchError(error => {
          console.error('Error fetching CSRF token', error);
          return throwError(() => new Error('Error fetching CSRF token'));
        })
      );
    }
  }


  getSolverData() {
    return this.http.get<any>(`${this.apiUrl}`);
  }

  postMatrixData(matrixData: any): Observable<any> {
    return this.fetchCsrfToken().pipe(
      switchMap(csrfToken => {
        if(csrfToken){
          const headers = new HttpHeaders({ 'X-CSRFToken': csrfToken, 'Content-Type': 'application/json' })
          return this.http.post<any>(this.apiUrl, matrixData, { headers, responseType:   'json'});
        }
        else return throwError(() => new Error('CSRF token is undefined.'));

      })
    );
  }

  postDegreeData(degreeData: any): Observable<any> {
    return this.fetchCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders({ 'X-CSRFToken': csrfToken, 'Content-Type': 'application/json' });
        return this.http.post<any>(this.apiAnotherUrl, degreeData, { headers, responseType:  'json' });
      })
    );
  }

  postOrdinatesData(ordinatesData: any): Observable<any> {
    return this.fetchCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders({ 'X-CSRFToken': csrfToken, 'Content-Type': 'application/json' });
        return this.http.post<any>(this.apiOrdinatesUrl, ordinatesData, { headers, responseType:  'json' });
      })
    );
  }


//   postMatrixData(matrixData: any) {
//     return this.http.post<any>( this.apiUrl, matrixData );
//   }

//   postDegreeData(degreeData: any) {
//      return this.http.post<any> ( this.apiAnotherUrl, degreeData ); //(`${this.apiUrl}another_post/`, degreeData);
//   }

//   postOrdinatesData(ordinatesData: any) {
//     return this.http.post<any> ( this.apiOrdinatesUrl, ordinatesData ); //(`${this.apiUrl}ordinates/`, ordinatesData);
//  }

  
  
}