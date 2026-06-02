import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth';

export type RegisterType =
  | 'Permanent Issuing Equipment Register'
  | 'Loaning of ICT Equipment Register'
  | 'Loaning Technicians Set-up Register'
  | 'Unit Storage Register';

export interface RegisterSignaturePayload {
  fileName: string;
  contentType: string;
  base64: string;
}

export interface RegisterPayload {
  registerType: RegisterType;
  dateOut: string;
  itemDescription: string;
  serialNumber: string;
  barCode: string;
  orderNumber: string;
  userFullName: string;
  extension: string;
  roomNumber: string;
  userSignOut?: RegisterSignaturePayload;
  storesOfficialName: string;
  storesOfficialSignOut?: RegisterSignaturePayload;
  comment: string;
}

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private readonly apiUrl = '/api/registers';

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
  ) {}

  save(payload: RegisterPayload): Observable<unknown> {
    return this.http.post(this.apiUrl, payload, { headers: this.authHeaders() });
  }

  private authHeaders(): HttpHeaders {
    const session = this.authService.currentSession();
    const token = session ? `${session.tokenType} ${session.token}` : '';

    return new HttpHeaders({
      Authorization: token,
      'Content-Type': 'application/json',
    });
  }
}
