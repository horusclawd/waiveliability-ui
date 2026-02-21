import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BrandingInfo {
  primaryColor: string | null;
  bgColor: string | null;
  fontFamily: string | null;
  logoUrl: string | null;
  hidePoweredBy: boolean;
}

export interface NotificationSettings {
  notificationsEnabled: boolean;
  notificationEmail: string | null;
}

export interface BusinessResponse {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'basic' | 'premium';
  address: string | null;
  phone: string | null;
  websiteUrl: string | null;
  branding: BrandingInfo;
  notificationsEnabled: boolean;
  notificationEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicBrandingResponse {
  tenantName: string;
  primaryColor: string | null;
  bgColor: string | null;
  fontFamily: string | null;
  logoUrl: string | null;
  hidePoweredBy: boolean;
}

/** Keep the Tenant alias for backwards compatibility */
export type Tenant = BusinessResponse;

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly _tenant = signal<BusinessResponse | null>(null);

  readonly tenant = this._tenant.asReadonly();
  readonly plan = () => this._tenant()?.plan ?? 'free';

  constructor(private http: HttpClient) {}

  load(): Observable<BusinessResponse> {
    return this.http
      .get<BusinessResponse>(`${environment.apiBaseUrl}/admin/business`, { withCredentials: true })
      .pipe(tap((tenant) => this._tenant.set(tenant)));
  }

  update(req: {
    name: string;
    address?: string;
    phone?: string;
    websiteUrl?: string;
  }): Observable<BusinessResponse> {
    return this.http
      .put<BusinessResponse>(`${environment.apiBaseUrl}/admin/business`, req, { withCredentials: true })
      .pipe(tap((tenant) => this._tenant.set(tenant)));
  }

  updateBranding(req: {
    primaryColor?: string;
    bgColor?: string;
    fontFamily?: string;
    hidePoweredBy: boolean;
  }): Observable<BusinessResponse> {
    return this.http
      .patch<BusinessResponse>(`${environment.apiBaseUrl}/admin/business/branding`, req, { withCredentials: true })
      .pipe(tap((tenant) => this._tenant.set(tenant)));
  }

  uploadLogo(file: File): Observable<BusinessResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<BusinessResponse>(`${environment.apiBaseUrl}/admin/business/logo`, formData, { withCredentials: true })
      .pipe(tap((tenant) => this._tenant.set(tenant)));
  }

  deleteLogo(): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiBaseUrl}/admin/business/logo`, { withCredentials: true })
      .pipe(
        tap(() => {
          const current = this._tenant();
          if (current) {
            this._tenant.set({
              ...current,
              branding: { ...current.branding, logoUrl: null },
            });
          }
        })
      );
  }

  getNotificationSettings(): Observable<NotificationSettings> {
    return this.http
      .get<NotificationSettings>(`${environment.apiBaseUrl}/admin/settings/notifications`, { withCredentials: true })
      .pipe(
        tap((settings) => {
          const current = this._tenant();
          if (current) {
            this._tenant.set({
              ...current,
              notificationsEnabled: settings.notificationsEnabled,
              notificationEmail: settings.notificationEmail,
            });
          }
        })
      );
  }

  updateNotificationSettings(req: {
    notificationsEnabled: boolean;
    notificationEmail: string | null;
  }): Observable<NotificationSettings> {
    return this.http
      .put<NotificationSettings>(`${environment.apiBaseUrl}/admin/settings/notifications`, req, { withCredentials: true })
      .pipe(
        tap((settings) => {
          const current = this._tenant();
          if (current) {
            this._tenant.set({
              ...current,
              notificationsEnabled: settings.notificationsEnabled,
              notificationEmail: settings.notificationEmail,
            });
          }
        })
      );
  }

  hasPlanFeature(requiredPlan: 'basic' | 'premium'): boolean {
    const planRank: Record<string, number> = { free: 0, basic: 1, premium: 2 };
    return (planRank[this.plan()] ?? 0) >= planRank[requiredPlan];
  }
}
