import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Form, FormField, FormSummary, PageResponse } from './form.model';

@Injectable({ providedIn: 'root' })
export class FormService {
  private readonly base = `${environment.apiBaseUrl}/admin/forms`;

  private readonly _forms = signal<FormSummary[]>([]);
  private readonly _currentForm = signal<Form | null>(null);

  readonly forms = this._forms.asReadonly();
  readonly currentForm = this._currentForm.asReadonly();

  constructor(private http: HttpClient) {}

  loadForms(): Observable<PageResponse<FormSummary>> {
    return this.http
      .get<PageResponse<FormSummary>>(`${this.base}?page=0&size=20`, { withCredentials: true })
      .pipe(tap((res) => this._forms.set(res.content)));
  }

  createForm(name: string, description?: string): Observable<Form> {
    return this.http.post<Form>(
      this.base,
      { name, description: description ?? null },
      { withCredentials: true }
    );
  }

  getForm(id: string): Observable<Form> {
    return this.http
      .get<Form>(`${this.base}/${id}`, { withCredentials: true })
      .pipe(tap((form) => this._currentForm.set(form)));
  }

  updateForm(id: string, name: string, description: string | null, fields: FormField[]): Observable<Form> {
    return this.http
      .put<Form>(`${this.base}/${id}`, { name, description, fields }, { withCredentials: true })
      .pipe(tap((form) => this._currentForm.set(form)));
  }

  deleteForm(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${id}`, { withCredentials: true })
      .pipe(
        tap(() => {
          this._forms.update((forms) => forms.filter((f) => f.id !== id));
        })
      );
  }

  publishForm(id: string): Observable<Form> {
    return this.http
      .post<Form>(`${this.base}/${id}/publish`, {}, { withCredentials: true })
      .pipe(
        tap((form) => {
          this._currentForm.set(form);
          this._forms.update((forms) =>
            forms.map((f) => (f.id === id ? { ...f, status: 'published' } : f))
          );
        })
      );
  }

  unpublishForm(id: string): Observable<Form> {
    return this.http
      .post<Form>(`${this.base}/${id}/unpublish`, {}, { withCredentials: true })
      .pipe(
        tap((form) => {
          this._currentForm.set(form);
          this._forms.update((forms) =>
            forms.map((f) => (f.id === id ? { ...f, status: 'draft' } : f))
          );
        })
      );
  }
}
