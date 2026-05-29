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

export type AuthSession = AuthResponse;

const ADMIN_ROLES = ['ADMIN', 'ICT_STOREROOM'];
const ASSET_APPROVAL_ROLES = ['ASSET_MANAGEMENT'];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authUrl = '/api/auth/login';
  private readonly storageKey = 'iarts.auth';

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.authUrl, { username, password })
      .pipe(tap((response) => this.storeSession(response)));
  }

  currentSession(): AuthSession | null {
    const session = localStorage.getItem(this.storageKey);

    if (!session) {
      return null;
    }

    try {
      return JSON.parse(session) as AuthSession;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  hasRole(role: string): boolean {
    return this.currentSession()?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: string[], session: AuthSession | null = this.currentSession()): boolean {
    return roles.some((role) => session?.roles.includes(role));
  }

  isAdmin(): boolean {
    return this.hasAnyRole(ADMIN_ROLES);
  }

  isTechnician(): boolean {
    return this.hasRole('TECHNICIAN');
  }

  routeForSession(session: AuthSession): string {
    if (this.hasAnyRole(ASSET_APPROVAL_ROLES, session)) {
      return '/assets-approval';
    }

    if (this.hasAnyRole(ADMIN_ROLES, session)) {
      return '/dashboard';
    }

    if (this.hasAnyRole(['TECHNICIAN'], session)) {
      return '/technician';
    }

    return '/requests';
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
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
