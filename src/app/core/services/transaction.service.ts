import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TransactionUpdateRequest, CategoryGroupDto } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  confirm(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/transactions/${id}/confirm`, {});
  }

  update(id: number, data: TransactionUpdateRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/transactions/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/transactions/${id}`);
  }

  getCategories(): Observable<CategoryGroupDto[]> {
    return this.http.get<CategoryGroupDto[]>(`${this.apiUrl}/api/categories`);
  }
}
