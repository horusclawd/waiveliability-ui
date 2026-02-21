import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AnalyticsOverview {
  totalSubmissions: number;
  pendingCount: number;
  reviewedCount: number;
  archivedCount: number;
  submissionsByDay: { date: string; count: number }[];
  submissionsByStatus: { status: string; count: number }[];
  recentSubmissions: RecentSubmission[];
}

export interface RecentSubmission {
  id: string;
  formId: string;
  formName: string;
  submitterName: string;
  submitterEmail: string | null;
  status: 'pending' | 'reviewed' | 'archived';
  submittedAt: string;
}

export interface FormAnalytics {
  formId: string;
  formName: string;
  totalSubmissions: number;
  pendingCount: number;
  reviewedCount: number;
  archivedCount: number;
  submissionsTrend: { date: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly base = `${environment.apiBaseUrl}/admin/analytics`;

  private readonly _overview = signal<AnalyticsOverview | null>(null);
  private readonly _formAnalytics = signal<Map<string, FormAnalytics>>(new Map());

  readonly overview = this._overview.asReadonly();
  readonly formAnalytics = this._formAnalytics.asReadonly();

  constructor(private http: HttpClient) {}

  getOverview(): Observable<AnalyticsOverview> {
    return this.http
      .get<AnalyticsOverview>(`${this.base}/overview`, { withCredentials: true })
      .pipe(tap((res) => this._overview.set(res)));
  }

  getFormAnalytics(formId: string): Observable<FormAnalytics> {
    const cached = this._formAnalytics().get(formId);
    if (cached) {
      return new Observable((subscriber) => {
        subscriber.next(cached);
        subscriber.complete();
      });
    }

    return this.http
      .get<FormAnalytics>(`${this.base}/forms/${formId}`, { withCredentials: true })
      .pipe(
        tap((res) => {
          const map = new Map(this._formAnalytics());
          map.set(formId, res);
          this._formAnalytics.set(map);
        })
      );
  }
}
