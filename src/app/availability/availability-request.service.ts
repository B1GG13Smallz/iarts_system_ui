import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { AuthService } from '../auth/auth';

export type AvailabilityStatus = 'PENDING' | 'AVAILABLE' | 'UNAVAILABLE';

export interface EquipmentAvailabilityRequest {
  id: number;
  referenceNumber: string;
  equipment: string;
  description: string | null;
  serialNumber: string | null;
  barCodeNumber: string | null;
  status: AvailabilityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableEquipmentDetails {
  description: string;
  serialNumber: string;
  barCodeNumber: string;
}

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

  createRequest(referenceNumber: string, equipment: string): Observable<EquipmentAvailabilityRequest> {
    return this.http
      .post<EquipmentAvailabilityRequest>(
        this.apiUrl,
        { referenceNumber, equipment },
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
