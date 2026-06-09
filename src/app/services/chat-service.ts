import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Message {
  id?: string;
  threadId: string;
  humanMessage: string;
  aiMessage: string | null;
  status: 'pending' | 'sent' | 'error';
  userId: number;
  createdAt?: Date;
  download_url?: string | null;
}
export interface MessageHistory {
  message_id: string;
  message_threadId: string;
  title: string;
  message_aiMessage: string | null;
  status: 'pending' | 'sent' | 'error';
  userId: number;
  createdAt?: Date;
}
@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.BaseAPI}/message`; // Match your NestJS port

  // --- State Management via Signals ---
  readonly messages = signal<Message[]>([]);
  readonly currentThreadId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);

  // Derived state: check if the last message is still waiting for the AI
  readonly isWaitingForAi = computed(() => 
    this.messages().some(m => m.status === 'pending')
  );

  /**
   * Starts a completely new conversation session
   */
  startNewChat(): void {
    this.currentThreadId.set(uuidv4());
    this.messages.set([]);
  }

  // Inside chat.service.ts
readonly threads = signal<any[]>([]);

loadUserThreads(): void {
  this.http.get<any[]>(`${this.apiUrl}/user-threads`,{ withCredentials: true })
    .subscribe(threads => {this.threads.set(threads)
      console.log("service threads",this.threads())});  
}
  /**
   * Loads history from PostgreSQL for an existing thread
   */
  loadThreadHistory(threadId: string): void {
    this.isLoading.set(true);
    this.currentThreadId.set(threadId);

    this.http.get<Message[]>(`${this.apiUrl}/thread/${threadId}`,{ withCredentials: true })
      .pipe(
        tap((history) => {
          this.messages.set(history);
          this.isLoading.set(false);
        }),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe();
  }

  /**
   * Sends a message to NestJS and updates local state
   */
  sendMessage(text: string, userId: number, file?: File | null): void {
    const threadId = this.currentThreadId();
  
    if (!threadId) {
      this.startNewChat();
    }
  
    const activeThreadId = this.currentThreadId()!;
  
    const tempMessage: Message = {
      humanMessage: text,
      aiMessage: null,
      status: 'pending',
      threadId: activeThreadId,
      userId: userId
    };
  
    this.messages.update((prev) => [...prev, tempMessage]);
    this.isLoading.set(true);
  
    // 🔥 Use FormData
    const formData = new FormData();
    formData.append('text', text);
    formData.append('threadId', activeThreadId);
  
    if (file) {
      formData.append('file', file, file.name);
    }
  
    this.http.post<Message>(`${this.apiUrl}/send`, formData, {
      withCredentials: true
    }).pipe(
      tap((response: Message) => {
        this.messages.update((prev) =>
          prev.map((m) =>
            m === tempMessage
              ? {
                  ...response,
                  download_url: response.download_url ?? null,
                }
              : m
          )
        );
      
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.messages.update((prev) =>
          prev.map((m) => m === tempMessage ? { ...m, status: 'error' } : m)
        );
        this.isLoading.set(false);
        return throwError(() => err);
      })
    ).subscribe();
  }
}