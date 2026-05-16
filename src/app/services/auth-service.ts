import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface User {
  userId: number;
  email: string;
  username?: string;
  password:string;

}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/auth';

  // Private signal for internal state
  private readonly _currentUser = signal<User | null>(null);

  // Public read-only derived state
  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => !!this._currentUser());

  /**
   * Note: NestJS must be configured to set an 'HttpOnly' cookie.
   * Angular doesn't 'store' the cookie; it just sends it with { withCredentials: true }.
   */
  login(credentials: unknown): Observable<User> {
    console.log("login cred",credentials);
    return this.http.post<User>(`${this.API_URL}/login`, credentials, {
      withCredentials: true // Required for cookie exchange
    }).pipe(
      tap((user) => this._currentUser.set(user))
    );
  }
  register(credentials: unknown): Observable<User> {
    console.log("credentials",credentials)
    return this.http.post<User>(`${this.API_URL}/register`, credentials, {
      withCredentials: true // Required for cookie exchange
    }).pipe(
      tap((user) => this._currentUser.set(user))
    );
  }

  logout(): void {
    this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => this._currentUser.set(null),
        error: () => this._currentUser.set(null) // Clear state regardless
      });
  } 

  // Use this in an Initializer or Guard to check session on page refresh
  checkSession(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile`, { withCredentials: true }).pipe(
      tap((user) => this._currentUser.set(user))
    );
  }
}
