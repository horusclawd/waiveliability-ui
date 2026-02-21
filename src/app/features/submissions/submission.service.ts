import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Submission } from './submission.model';
import { PageResponse } from '../forms/form.model';

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  private http = inject(HttpClient);
  private adminBase = `${environment.apiBaseUrl}/admin/submissions`;

  submissions = signal<Submission[]>([]);

  loadSubmissions(params?: { formId?: string; status?: string; submitterName?: string }) {
    const query = new URLSearchParams();
    if (params?.formId) query.set('formId', params.formId);
    if (params?.status) query.set('status', params.status);
    if (params?.submitterName) query.set('submitterName', params.submitterName);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.http
      .get<PageResponse<Submission>>(`${this.adminBase}${qs}`, { withCredentials: true })
      .pipe(tap(page => this.submissions.set(page.content)));
  }

  submitPublicForm(tenantSlug: string, formId: string, answers: Record<string, unknown>, signatureData?: string) {
    return this.http.post<Submission>(
      `${environment.apiBaseUrl}/public/${tenantSlug}/forms/${formId}/submit`,
      { answers, signatureData: signatureData ?? null }
    );
  }

  getSubmission(id: string) {
    return this.http.get<Submission>(`${this.adminBase}/${id}`, { withCredentials: true });
  }

  getPublicForm(tenantSlug: string, formId: string) {
    return this.http.get<import('../forms/form.model').Form>(`${environment.apiBaseUrl}/public/${tenantSlug}/forms/${formId}`);
  }

  updateStatus(id: string, status: string) {
    return this.http.patch<Submission>(
      `${this.adminBase}/${id}/status`,
      { status },
      { withCredentials: true }
    ).pipe(tap(updated => {
      this.submissions.update(list => list.map(s => s.id === id ? updated : s));
    }));
  }

  deleteSubmission(id: string) {
    return this.http.delete<void>(
      `${this.adminBase}/${id}`,
      { withCredentials: true }
    ).pipe(tap(() => {
      this.submissions.update(list => list.filter(s => s.id !== id));
    }));
  }

  exportCsv(params?: { formId?: string; status?: string; submitterName?: string }) {
    const query = new URLSearchParams();
    if (params?.formId) query.set('formId', params.formId);
    if (params?.status) query.set('status', params.status);
    if (params?.submitterName) query.set('submitterName', params.submitterName);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.http.get(`${this.adminBase}/export${qs}`, {
      withCredentials: true,
      responseType: 'blob'
    });
  }
}
