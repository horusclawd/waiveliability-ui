import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CustomDomain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'active' | 'failed';
  sslStatus: 'pending' | 'active' | 'failed' | null;
  sslExpiresAt: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

export interface CustomDomainVerification {
  domain: string;
  txtRecord: string;
  expectedValue: string;
  cnameRecord: string | null;
}

@Injectable({ providedIn: 'root' })
export class CustomDomainService {
  private readonly base = `${environment.apiBaseUrl}/admin/settings/domain`;

  private readonly _domain = signal<CustomDomain | null>(null);
  private readonly _verification = signal<CustomDomainVerification | null>(null);
  private readonly _loading = signal(false);
  private readonly _verifying = signal(false);

  readonly domain = this._domain.asReadonly();
  readonly verification = this._verification.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly verifying = this._verifying.asReadonly();

  constructor(private http: HttpClient) {}

  getCustomDomain(): Observable<CustomDomain | null> {
    this._loading.set(true);

    return this.http
      .get<CustomDomain | null>(this.base, { withCredentials: true })
      .pipe(
        tap((domain) => {
          this._domain.set(domain);
          this._loading.set(false);
        })
      );
  }

  setCustomDomain(domain: string): Observable<CustomDomain> {
    this._loading.set(true);

    return this.http
      .post<CustomDomain>(this.base, { domain }, { withCredentials: true })
      .pipe(
        tap((domain) => {
          this._domain.set(domain);
          this._loading.set(false);
        })
      );
  }

  removeCustomDomain(): Observable<void> {
    return this.http
      .delete<void>(this.base, { withCredentials: true })
      .pipe(
        tap(() => {
          this._domain.set(null);
          this._verification.set(null);
        })
      );
  }

  verifyCustomDomain(): Observable<CustomDomainVerification> {
    this._verifying.set(true);

    return this.http
      .post<CustomDomainVerification>(`${this.base}/verify`, {}, { withCredentials: true })
      .pipe(
        tap((verification) => {
          this._verification.set(verification);
          this._verifying.set(false);
        })
      );
  }

  checkVerificationStatus(): Observable<CustomDomain> {
    return this.http
      .get<CustomDomain>(`${this.base}/status`, { withCredentials: true })
      .pipe(
        tap((domain) => {
          this._domain.set(domain);
        })
      );
  }
}
