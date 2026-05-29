import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth';

export interface TechnicianRequestDetails {
  request: {
    id: number;
    referenceNumber: string;
    itpNumber: string;
    orderNumber: string;
    chiefDirectorate: string;
    subDirectorate: string;
    objective: string;
    responsibility: string;
    chiefUser: string;
    callReference: string;
    currentOwner: string;
    currentBuilding: string;
    currentFloor: string;
    currentOffice: string;
    currentRegion: string;
    currentContact: string;
    destinationOwner: string;
    destinationBuilding: string;
    destinationFloor: string;
    destinationOffice: string;
    destinationRegion: string;
    destinationContact: string;
    movementReason: string;
    status: string;
  };
  availabilityStatus: string;
  equipment: string;
  equipmentDescription: string;
  serialNumber: string;
  barCodeNumber: string;
}

export type TechnicianRequestStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'READY_FOR_DELIVERY' | 'COMPLETED';

@Injectable({
  providedIn: 'root',
})
export class TechnicianService {
  private readonly apiUrl = '/api/intra-requests/reference';

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
  ) {}

  findByReference(referenceNumber: string): Observable<TechnicianRequestDetails> {
    return this.http.get<TechnicianRequestDetails>(
      `${this.apiUrl}/${encodeURIComponent(referenceNumber)}`,
      { headers: this.authHeaders() },
    );
  }

  updateStatus(requestId: number, status: TechnicianRequestStatus): Observable<TechnicianRequestDetails['request']> {
    return this.http.patch<TechnicianRequestDetails['request']>(
      `/api/intra-requests/${requestId}/status`,
      { status },
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
