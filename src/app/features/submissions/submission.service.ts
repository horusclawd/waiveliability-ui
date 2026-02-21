import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Submission } from './submission.model';
import { Form, PageResponse } from '../forms/form.model';

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  private http = inject(HttpClient);
  private adminBase = `${environment.apiBaseUrl}/admin/submissions`;

  submissions = signal<Submission[]>([]);

  loadSubmissions(formId?: string) {
    const params = formId ? `?formId=${formId}` : '';
    return this.http
      .get<PageResponse<Submission>>(`${this.adminBase}${params}`, { withCredentials: true })
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
    return this.http.get<Form>(`${environment.apiBaseUrl}/public/${tenantSlug}/forms/${formId}`);
  }
}
