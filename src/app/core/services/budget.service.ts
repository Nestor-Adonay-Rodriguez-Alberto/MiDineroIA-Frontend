import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BudgetRequest } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  upsert(request: BudgetRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/budgets`, request);
  }
}
