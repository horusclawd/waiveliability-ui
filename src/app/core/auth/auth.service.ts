import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
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
    this.clearSession();
    this.router.navigate(['/auth/login']);
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
