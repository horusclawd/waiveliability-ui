import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Template, TemplateSummary } from './template.model';
import { PageResponse, Form } from '../forms/form.model';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/admin/templates`;

  templates = signal<TemplateSummary[]>([]);

  loadTemplates(category?: string | null) {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http
      .get<PageResponse<TemplateSummary>>(this.base, { params, withCredentials: true })
      .pipe(tap(page => this.templates.set(page.content)));
  }

  getTemplate(id: string) {
    return this.http.get<Template>(`${this.base}/${id}`, { withCredentials: true });
  }

  importTemplate(id: string) {
    return this.http.post<Form>(`${this.base}/${id}/import`, {}, { withCredentials: true });
  }
}
