import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PermissionRemovalRecord, PermissionToRemoveEquipmentPayload } from '../models/permission-removal.model';
import { AuthService } from './auth.service';

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

  sendToStoreroom(payload: PermissionToRemoveEquipmentPayload): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(
      `${this.apiUrl}/send-to-storeroom`,
      payload,
      { headers: this.authHeaders() },
    );
  }

  search(identityOrPersalNumber: string, workflowStatus?: string): Observable<PermissionRemovalRecord[]> {
    const params = new URLSearchParams();
    if (identityOrPersalNumber.trim()) {
      params.set('identityOrPersalNumber', identityOrPersalNumber.trim());
    }
    if (workflowStatus) {
      params.set('workflowStatus', workflowStatus);
    }

    const query = params.toString();
    return this.http.get<PermissionRemovalRecord[]>(
      query ? `${this.apiUrl}?${query}` : this.apiUrl,
      { headers: this.authHeaders() },
    );
  }

  sendToAssets(id: number, payload: PermissionToRemoveEquipmentPayload): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(
      `${this.apiUrl}/${id}/send-to-assets`,
      payload,
      { headers: this.authHeaders() },
    );
  }

  saveAssetsApproval(id: number, payload: PermissionToRemoveEquipmentPayload): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(
      `${this.apiUrl}/${id}/assets-approval`,
      payload,
      { headers: this.authHeaders() },
    );
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
