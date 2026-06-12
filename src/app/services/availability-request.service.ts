import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { AvailableEquipmentDetails, AvailabilityStatus, EquipmentAvailabilityRequest } from '../models/availability-request.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityRequestService {
  private readonly apiUrl = '/api/availability-requests';
  readonly request = signal<EquipmentAvailabilityRequest | null>(null);
  readonly requests = signal<EquipmentAvailabilityRequest[]>([]);

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
  ) {}

  createRequest(equipment: string, rank: string): Observable<EquipmentAvailabilityRequest> {
    return this.http
      .post<EquipmentAvailabilityRequest>(
        this.apiUrl,
        { equipment, rank },
        { headers: this.authHeaders() },
      )
      .pipe(tap((request) => this.request.set(request)));
  }

  clearCurrentRequest(): void {
    this.request.set(null);
  }

  updateReference(id: number, referenceNumber: string): Observable<EquipmentAvailabilityRequest> {
    return this.http
      .patch<EquipmentAvailabilityRequest>(
        `${this.apiUrl}/${id}/reference`,
        { referenceNumber },
        { headers: this.authHeaders() },
      )
      .pipe(tap((request) => this.request.set(request)));
  }

  loadLatestMine(): Observable<EquipmentAvailabilityRequest | null> {
    return this.http
      .get<EquipmentAvailabilityRequest>(`${this.apiUrl}/mine/latest`, { headers: this.authHeaders() })
      .pipe(
        tap((request) => this.request.set(request)),
        catchError(() => {
          this.request.set(null);
          return of(null);
        }),
      );
  }

  loadAll(): Observable<EquipmentAvailabilityRequest[]> {
    return this.http
      .get<EquipmentAvailabilityRequest[]>(this.apiUrl, { headers: this.authHeaders() })
      .pipe(tap((requests) => this.requests.set(requests)));
  }

  updateStatus(
    id: number,
    status: AvailabilityStatus,
    details?: AvailableEquipmentDetails,
  ): Observable<EquipmentAvailabilityRequest> {
    return this.http
      .patch<EquipmentAvailabilityRequest>(
        `${this.apiUrl}/${id}/status`,
        { status, ...details },
        { headers: this.authHeaders() },
      )
      .pipe(
        tap((updatedRequest) => {
          this.request.set(updatedRequest);
          this.requests.update((requests) =>
            requests.map((request) => (request.id === updatedRequest.id ? updatedRequest : request)),
          );
        }),
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
