import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardResponse } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getDashboard(year: number, month: number): Observable<DashboardResponse> {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month);

    return this.http.get<DashboardResponse>(`${this.apiUrl}/api/dashboard`, { params });
  }
}
