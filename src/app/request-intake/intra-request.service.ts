import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth';

export interface IntraRequestPayload {
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
}

export interface IntraRequestRecord extends IntraRequestPayload {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

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
