import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IntraRequestPayload, IntraRequestRecord } from '../models/intra-request.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class IntraRequestService {
  private readonly apiUrl = '/api/intra-requests';

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
  ) {}

  save(payload: IntraRequestPayload): Observable<unknown> {
    return this.http.post(this.apiUrl, payload, { headers: this.authHeaders() });
  }

  findMine(): Observable<IntraRequestRecord[]> {
    return this.http.get<IntraRequestRecord[]>(`${this.apiUrl}/mine`, { headers: this.authHeaders() });
  }

  findAll(): Observable<IntraRequestRecord[]> {
    return this.http.get<IntraRequestRecord[]>(this.apiUrl, { headers: this.authHeaders() });
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
