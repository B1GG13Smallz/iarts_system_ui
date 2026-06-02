import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth';

export interface PermissionSignaturePayload {
  fileName: string;
  contentType: string;
  base64: string;
}

export interface PermissionToRemoveEquipmentPayload {
  officialName: string;
  unitDirectorateBranch: string;
  telephoneNumber: string;
  identityOrPersalNumber: string;
  removalReason: string;
  officialSignature?: PermissionSignaturePayload;
  equipmentDescription: string;
  barCode: string;
  serialNumber: string;
  currentLocation: string;
  period: string;
  newLocation: string;
  ictSignature?: PermissionSignaturePayload;
  ictDate: string;
  mamSignature?: PermissionSignaturePayload;
  mamDate: string;
  securitySignature?: PermissionSignaturePayload;
  securityDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class PermissionToRemoveEquipmentService {
  private readonly apiUrl = '/api/permission-removals';

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
  ) {}

  save(payload: PermissionToRemoveEquipmentPayload): Observable<unknown> {
    return this.http.post(this.apiUrl, payload, { headers: this.authHeaders() });
  }

  generatePdf(payload: PermissionToRemoveEquipmentPayload): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/pdf`, payload, {
      headers: this.authHeaders(),
      responseType: 'blob',
    });
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
