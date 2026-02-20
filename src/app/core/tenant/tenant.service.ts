import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'basic' | 'premium';
  address?: string;
  phone?: string;
  websiteUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly _tenant = signal<Tenant | null>(null);

  readonly tenant = this._tenant.asReadonly();
  readonly plan = () => this._tenant()?.plan ?? 'free';

  constructor(private http: HttpClient) {}

  load() {
    return this.http
      .get<Tenant>(`${environment.apiBaseUrl}/admin/business`)
      .pipe(tap((tenant) => this._tenant.set(tenant)));
  }

  hasPlanFeature(requiredPlan: 'basic' | 'premium'): boolean {
    const planRank: Record<string, number> = { free: 0, basic: 1, premium: 2 };
    return (planRank[this.plan()] ?? 0) >= planRank[requiredPlan];
  }
}
