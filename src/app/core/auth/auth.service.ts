import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor(private http: HttpClient, private router: Router) {}

  /** Called by APP_INITIALIZER — restores user session on page refresh. */
  loadCurrentUser(): Promise<void> {
    return lastValueFrom(
      this.http
        .get<AuthUser>(`${environment.apiBaseUrl}/admin/me`, { withCredentials: true })
        .pipe(
          tap((user) => this._user.set(user)),
          catchError(() => {
            this._user.set(null);
            return of(null);
          })
        ),
      { defaultValue: undefined }
    ).then(() => undefined);
  }

  login(email: string, password: string) {
    return this.http
      .post(`${environment.apiBaseUrl}/auth/login`, { email, password }, { withCredentials: true })
      .pipe(
        switchMap(() =>
          this.http.get<AuthUser>(`${environment.apiBaseUrl}/admin/me`, { withCredentials: true })
        ),
        tap((user) => this._user.set(user))
      );
  }

  register(name: string, email: string, password: string, businessName: string) {
    return this.http
      .post(
        `${environment.apiBaseUrl}/auth/register`,
        { name, email, password, businessName },
        { withCredentials: true }
      )
      .pipe(
        switchMap(() =>
          this.http.get<AuthUser>(`${environment.apiBaseUrl}/admin/me`, { withCredentials: true })
        ),
        tap((user) => this._user.set(user))
      );
  }

  logout() {
    this.http
      .post(`${environment.apiBaseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this._user.set(null);
        this.router.navigate(['/auth/login']);
      });
  }

  refreshToken() {
    return this.http.post(
      `${environment.apiBaseUrl}/auth/refresh`,
      {},
      { withCredentials: true }
    );
  }
}
