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
  destinationOwner: string;
  destinationBuilding: string;
  destinationFloor: string;
  destinationOffice: string;
  destinationRegion: string;
  destinationContact: string;
  movementReason: string;
}

@Injectable({
  providedIn: 'root',
})
export class IntraRequestService {
  private readonly apiUrl = 'http://localhost:8080/api/intra-requests';

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
  ) {}

  save(payload: IntraRequestPayload): Observable<unknown> {
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
