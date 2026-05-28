import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authUrl = 'http://localhost:8080/api/auth/login';
  private readonly storageKey = 'iarts.auth';

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.authUrl, { username, password })
      .pipe(tap((response) => this.storeSession(response)));
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify({
        token: response.token,
        tokenType: response.tokenType,
        userId: response.userId,
        username: response.username,
        roles: response.roles,
      }),
    );
  }
}
