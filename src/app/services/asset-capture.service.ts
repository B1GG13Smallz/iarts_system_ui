import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { EquipmentStockItem, EquipmentStockPayload } from '../models/asset-capture.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AssetCaptureService {
  private readonly apiUrl = '/api/assets';
  readonly stock = signal<EquipmentStockItem[]>([]);

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
  ) {}

  loadAll(): Observable<EquipmentStockItem[]> {
    return this.http
      .get<EquipmentStockItem[]>(this.apiUrl, { headers: this.authHeaders() })
      .pipe(tap((stock) => this.stock.set(stock)));
  }

  create(payload: EquipmentStockPayload): Observable<EquipmentStockItem> {
    return this.http
      .post<EquipmentStockItem>(this.apiUrl, payload, { headers: this.authHeaders() })
      .pipe(tap((item) => this.stock.update((stock) => [item, ...stock])));
  }

  update(id: number, payload: EquipmentStockPayload): Observable<EquipmentStockItem> {
    return this.http
      .put<EquipmentStockItem>(`${this.apiUrl}/${id}`, payload, { headers: this.authHeaders() })
      .pipe(tap((item) => this.stock.update((stock) => stock.map((existing) => (existing.id === id ? item : existing)))));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`, { headers: this.authHeaders() })
      .pipe(tap(() => this.stock.update((stock) => stock.filter((item) => item.id !== id))));
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
