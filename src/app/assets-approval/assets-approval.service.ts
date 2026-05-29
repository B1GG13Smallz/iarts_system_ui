import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth';

export interface AssetApprovalPayload {
  requestId: number;
  movableAssetName: string;
  approvalDate: string;
  signatureFileName: string;
  signatureContentType: string;
  signatureBase64: string;
}

@Injectable({
  providedIn: 'root',
})
export class AssetsApprovalService {
  private readonly apiUrl = '/api/asset-approvals';

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
  ) {}

  save(payload: AssetApprovalPayload): Observable<unknown> {
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
