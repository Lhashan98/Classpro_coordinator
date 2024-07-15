import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClassdetailsService {
  private apiUrl = 'http://localhost:8002'; // Adjust the URL to your backend endpoint


  constructor(private http: HttpClient) { }
  getReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/addreport/getAll`);
  }

  addNewReport(reportData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addreport/create`, reportData);
  }
}
