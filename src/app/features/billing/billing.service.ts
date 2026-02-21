import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Subscription {
  plan: 'free' | 'basic' | 'premium';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface UsageLimits {
  forms: { used: number; limit: number };
  submissions: { used: number; limit: number };
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    forms: number;
    submissions: number;
  };
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly base = `${environment.apiBaseUrl}/admin/billing`;

  private readonly _subscription = signal<Subscription | null>(null);
  private readonly _usageLimits = signal<UsageLimits | null>(null);

  readonly subscription = this._subscription.asReadonly();
  readonly usageLimits = this._usageLimits.asReadonly();

  readonly plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['3 forms', '100 submissions', 'Email support'],
      limits: { forms: 3, submissions: 100 },
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      features: ['10 forms', '1000 submissions', 'Custom branding', 'Email alerts'],
      limits: { forms: 10, submissions: 1000 },
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 99,
      features: ['Unlimited forms', 'Unlimited submissions', 'Analytics', 'Team members', 'Priority support'],
      limits: { forms: -1, submissions: -1 },
    },
  ];

  constructor(private http: HttpClient) {}

  getSubscription(): Observable<Subscription> {
    return this.http
      .get<Subscription>(`${this.base}/subscription`, { withCredentials: true })
      .pipe(tap((sub) => this._subscription.set(sub)));
  }

  getLimits(): Observable<UsageLimits> {
    return this.http
      .get<UsageLimits>(`${this.base}/limits`, { withCredentials: true })
      .pipe(tap((limits) => this._usageLimits.set(limits)));
  }

  createCheckoutSession(planId: string): Observable<{ url: string }> {
    return this.http
      .post<{ url: string }>(`${this.base}/checkout`, { planId }, { withCredentials: true });
  }

  createPortalSession(): Observable<{ url: string }> {
    return this.http
      .post<{ url: string }>(`${this.base}/portal`, {}, { withCredentials: true });
  }

  getPlan(planId: string): Plan | undefined {
    return this.plans.find((p) => p.id === planId);
  }

  refresh(): void {
    this.getSubscription().subscribe();
    this.getLimits().subscribe();
  }
}
