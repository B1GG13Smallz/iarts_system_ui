import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterPayload, RegisterRecord, RegisterType, StoresOfficialSignaturePayload } from '../models/register.model';
import { AuthService } from './auth.service';

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

  findByRegisterType(registerType: RegisterType): Observable<RegisterRecord[]> {
    return this.http.get<RegisterRecord[]>(
      `${this.apiUrl}?registerType=${encodeURIComponent(registerType)}`,
      { headers: this.authHeaders() },
    );
  }

  signStoresOfficial(id: number, payload: StoresOfficialSignaturePayload): Observable<RegisterRecord> {
    return this.http.patch<RegisterRecord>(
      `${this.apiUrl}/${id}/stores-official-signature`,
      payload,
      { headers: this.authHeaders() },
    );
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
