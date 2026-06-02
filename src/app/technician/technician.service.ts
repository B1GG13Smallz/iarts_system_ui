import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { AuthService } from '../auth/auth';
import { EquipmentAvailabilityRequest } from '../availability/availability-request.service';

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
  source?: 'INTRA' | 'AVAILABILITY';
}

export type TechnicianRequestStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'READY_FOR_DELIVERY' | 'COMPLETED';

@Injectable({
  providedIn: 'root',
})
export class TechnicianService {
  private readonly apiUrl = '/api/intra-requests/reference';
  private readonly availabilityUrl = '/api/availability-requests';

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
  ) {}

  findByReference(referenceNumber: string): Observable<TechnicianRequestDetails> {
    const cleanReference = referenceNumber.trim().toUpperCase();

    return this.http.get<TechnicianRequestDetails>(
      `${this.apiUrl}/${encodeURIComponent(cleanReference)}`,
      { headers: this.authHeaders() },
    ).pipe(
      catchError(() => this.findAvailabilityDetails(cleanReference)),
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

  private findAvailabilityDetails(referenceNumber: string): Observable<TechnicianRequestDetails> {
    return this.http
      .get<EquipmentAvailabilityRequest[]>(this.availabilityUrl, { headers: this.authHeaders() })
      .pipe(
        map((requests) => {
          const availabilityRequest = requests.find(
            (request) => request.referenceNumber?.trim().toUpperCase() === referenceNumber,
          );

          if (!availabilityRequest) {
            throw new Error('No request found for that reference number.');
          }

          return {
            request: {
              id: availabilityRequest.id,
              referenceNumber: availabilityRequest.referenceNumber || referenceNumber,
              itpNumber: '',
              orderNumber: '',
              chiefDirectorate: 'Not captured',
              subDirectorate: 'Not captured',
              objective: `${availabilityRequest.equipment} request`,
              responsibility: 'Not captured',
              chiefUser: 'Not captured',
              callReference: availabilityRequest.referenceNumber || referenceNumber,
              currentOwner: 'IS STOREROOM',
              currentBuilding: 'CGO',
              currentFloor: '4TH',
              currentOffice: '441',
              currentRegion: 'HEAD OFFICE',
              currentContact: '012 406 1724',
              destinationOwner: 'Not captured',
              destinationBuilding: 'Not captured',
              destinationFloor: 'Not captured',
              destinationOffice: 'Not captured',
              destinationRegion: 'Not captured',
              destinationContact: 'Not captured',
              movementReason: 'Not captured',
              status: availabilityRequest.status,
            },
            availabilityStatus: availabilityRequest.status,
            equipment: availabilityRequest.equipment,
            equipmentDescription: availabilityRequest.description || '',
            serialNumber: availabilityRequest.serialNumber || '',
            barCodeNumber: availabilityRequest.barCodeNumber || '',
            source: 'AVAILABILITY' as const,
          };
        }),
      );
  }
}
