import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'form' | 'submission' | 'team_member' | 'tenant' | 'settings';
  entityId: string | null;
  entityName: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  userId?: string;
  userName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface AuditLogResponse {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly base = `${environment.apiBaseUrl}/admin/audit-logs`;

  private readonly _logs = signal<AuditLog[]>([]);
  private readonly _totalElements = signal(0);
  private readonly _loading = signal(false);

  readonly logs = this._logs.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor(private http: HttpClient) {}

  getAuditLogs(filters?: AuditLogFilters): Observable<AuditLogResponse> {
    this._loading.set(true);

    let params = new HttpParams();
    if (filters) {
      if (filters.action) params = params.set('action', filters.action);
      if (filters.entityType) params = params.set('entityType', filters.entityType);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.page !== undefined) params = params.set('page', filters.page.toString());
      if (filters.size !== undefined) params = params.set('size', filters.size.toString());
    }

    return this.http
      .get<AuditLogResponse>(this.base, { params, withCredentials: true })
      .pipe(
        tap((response) => {
          this._logs.set(response.content);
          this._totalElements.set(response.totalElements);
          this._loading.set(false);
        })
      );
  }

  exportAuditLogs(filters?: AuditLogFilters): Observable<Blob> {
    let params = new HttpParams();
    if (filters) {
      if (filters.action) params = params.set('action', filters.action);
      if (filters.entityType) params = params.set('entityType', filters.entityType);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.http.get(`${this.base}/export`, {
      params,
      responseType: 'blob',
      withCredentials: true,
    });
  }

  getAvailableActions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/actions`, { withCredentials: true });
  }
}
