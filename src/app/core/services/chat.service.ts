import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatRequest, ChatResponse, ChatHistoryResponse } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/api/chat`, request);
  }

  getHistory(page: number, pageSize: number): Observable<ChatHistoryResponse> {
    return this.http.get<ChatHistoryResponse>(
      `${this.apiUrl}/api/chat/history?page=${page}&pageSize=${pageSize}`
    );
  }
}
