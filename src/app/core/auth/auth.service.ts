import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _token = signal<string | null>(
    localStorage.getItem('wl_access_token')
  );

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  constructor(private http: HttpClient, private router: Router) {}

  /** Called by APP_INITIALIZER — restores user session on page refresh. */
  loadCurrentUser(): Promise<void> {
    if (!this._token()) {
      return Promise.resolve();
    }
    return this.http
      .get<AuthUser>(`${environment.apiBaseUrl}/admin/me`)
      .pipe(
        tap((user) => this._user.set(user)),
        catchError(() => {
          this.clearSession();
          return of(null);
        })
      )
      .toPromise()
      .then(() => undefined);
  }

  login(email: string, password: string) {
    return this.http
      .post<{ accessToken: string; user: AuthUser }>(
        `${environment.apiBaseUrl}/auth/login`,
        { email, password }
      )
      .pipe(
        tap(({ accessToken, user }) => {
          this.setSession(accessToken, user);
        })
      );
  }

  register(name: string, email: string, password: string, businessName: string) {
    return this.http
      .post<{ accessToken: string; user: AuthUser }>(
        `${environment.apiBaseUrl}/auth/register`,
        { name, email, password, businessName }
      )
      .pipe(
        tap(({ accessToken, user }) => {
          this.setSession(accessToken, user);
        })
      );
  }

  logout() {
    this.http
      .post(`${environment.apiBaseUrl}/auth/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.clearSession();
        this.router.navigate(['/auth/login']);
      });
  }

  refreshToken() {
    return this.http
      .post<{ accessToken: string }>(
        `${environment.apiBaseUrl}/auth/refresh`,
        {}
      )
      .pipe(
        tap(({ accessToken }) => {
          this._token.set(accessToken);
          localStorage.setItem('wl_access_token', accessToken);
        })
      );
  }

  private setSession(token: string, user: AuthUser) {
    this._token.set(token);
    this._user.set(user);
    localStorage.setItem('wl_access_token', token);
  }

  private clearSession() {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem('wl_access_token');
  }
}
