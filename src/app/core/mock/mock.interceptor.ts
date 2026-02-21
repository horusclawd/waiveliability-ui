import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Form, FormField, FormSummary, PageResponse } from '../../features/forms/form.model';

// Canned mock data
const MOCK_USER = {
  userId: 'user-001',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'admin',
  tenantId: 'tenant-001',
};

// ─── Forms mock data ──────────────────────────────────────────────────────────

const SEED_FORM_1_FIELDS: FormField[] = [
  { id: 'f001-f1', fieldType: 'text',  label: 'Full Name',  placeholder: 'Enter your name',  required: true,  fieldOrder: 0, options: null },
  { id: 'f001-f2', fieldType: 'email', label: 'Email',      placeholder: 'Enter your email', required: true,  fieldOrder: 1, options: null },
  { id: 'f001-f3', fieldType: 'text',  label: 'Signature',  placeholder: 'Type your signature', required: true, fieldOrder: 2, options: null },
];

const SEED_FORM_2_FIELDS: FormField[] = [
  { id: 'f002-f1', fieldType: 'text',     label: 'Full Name', placeholder: 'Enter your name', required: true,  fieldOrder: 0, options: null },
  { id: 'f002-f2', fieldType: 'checkbox', label: 'I agree to the terms', placeholder: null,  required: true,  fieldOrder: 1, options: null },
];

let mockForms: FormSummary[] = [
  {
    id: 'form-001',
    name: 'Customer Waiver',
    description: 'Standard customer waiver form',
    status: 'published',
    fieldCount: 3,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-15T12:00:00Z',
  },
  {
    id: 'form-002',
    name: 'Liability Release',
    description: null,
    status: 'draft',
    fieldCount: 2,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
];

const mockFormDetails = new Map<string, Form>([
  [
    'form-001',
    {
      id: 'form-001',
      name: 'Customer Waiver',
      description: 'Standard customer waiver form',
      status: 'published',
      fields: SEED_FORM_1_FIELDS,
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-01-15T12:00:00Z',
    },
  ],
  [
    'form-002',
    {
      id: 'form-002',
      name: 'Liability Release',
      description: null,
      status: 'draft',
      fields: SEED_FORM_2_FIELDS,
      createdAt: '2026-02-01T09:00:00Z',
      updatedAt: '2026-02-01T09:00:00Z',
    },
  ],
]);

// ─── End forms mock data ──────────────────────────────────────────────────────

// ─── Submissions mock data ────────────────────────────────────────────────────

let mockSubmissions: any[] = [];

// ─── End submissions mock data ────────────────────────────────────────────────

// ─── Templates mock data ──────────────────────────────────────────────────────

const MOCK_TEMPLATES: import('../../features/templates/template.model').TemplateSummary[] = [
  { id: 'tpl-001', name: 'Basic Waiver', description: 'Simple liability waiver with name, email and signature', category: 'waiver', isPremium: false, usageCount: 142, fieldCount: 3, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'tpl-002', name: 'Activity Release', description: 'Activity participation release with emergency contact', category: 'waiver', isPremium: false, usageCount: 89, fieldCount: 4, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'tpl-003', name: 'NDA Agreement', description: 'Non-disclosure agreement with terms checkbox', category: 'legal', isPremium: true, usageCount: 56, fieldCount: 4, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'tpl-004', name: 'Photo Release', description: 'Photo and media release consent form', category: 'consent', isPremium: false, usageCount: 73, fieldCount: 4, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const MOCK_TEMPLATE_DETAILS = new Map([
  ['tpl-001', { id: 'tpl-001', name: 'Basic Waiver', description: 'Simple liability waiver with name, email and signature', category: 'waiver', isPremium: false, usageCount: 142, fields: [
    { id: 'tf-001-1', fieldType: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true, fieldOrder: 0, options: null },
    { id: 'tf-001-2', fieldType: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true, fieldOrder: 1, options: null },
    { id: 'tf-001-3', fieldType: 'text', label: 'Signature', placeholder: 'Type your full name as signature', required: true, fieldOrder: 2, options: null },
  ], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
  ['tpl-002', { id: 'tpl-002', name: 'Activity Release', description: 'Activity participation release with emergency contact', category: 'waiver', isPremium: false, usageCount: 89, fields: [
    { id: 'tf-002-1', fieldType: 'text', label: 'Participant Name', placeholder: 'Full name', required: true, fieldOrder: 0, options: null },
    { id: 'tf-002-2', fieldType: 'email', label: 'Email', placeholder: 'Email address', required: true, fieldOrder: 1, options: null },
    { id: 'tf-002-3', fieldType: 'text', label: 'Emergency Contact', placeholder: 'Name and phone number', required: true, fieldOrder: 2, options: null },
    { id: 'tf-002-4', fieldType: 'checkbox', label: 'I agree to the terms and conditions', placeholder: null, required: true, fieldOrder: 3, options: null },
  ], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
  ['tpl-003', { id: 'tpl-003', name: 'NDA Agreement', description: 'Non-disclosure agreement with terms checkbox', category: 'legal', isPremium: true, usageCount: 56, fields: [
    { id: 'tf-003-1', fieldType: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true, fieldOrder: 0, options: null },
    { id: 'tf-003-2', fieldType: 'text', label: 'Company Name', placeholder: 'Your company or organization', required: false, fieldOrder: 1, options: null },
    { id: 'tf-003-3', fieldType: 'email', label: 'Email', placeholder: 'Enter your email', required: true, fieldOrder: 2, options: null },
    { id: 'tf-003-4', fieldType: 'checkbox', label: 'I agree to the terms of this NDA', placeholder: null, required: true, fieldOrder: 3, options: null },
  ], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
  ['tpl-004', { id: 'tpl-004', name: 'Photo Release', description: 'Photo and media release consent form', category: 'consent', isPremium: false, usageCount: 73, fields: [
    { id: 'tf-004-1', fieldType: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true, fieldOrder: 0, options: null },
    { id: 'tf-004-2', fieldType: 'email', label: 'Email', placeholder: 'Enter your email', required: true, fieldOrder: 1, options: null },
    { id: 'tf-004-3', fieldType: 'checkbox', label: 'I grant permission to use my photo/likeness', placeholder: null, required: true, fieldOrder: 2, options: null },
    { id: 'tf-004-4', fieldType: 'text', label: 'Signature', placeholder: 'Type your full name', required: true, fieldOrder: 3, options: null },
  ], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
]);

// ─── End templates mock data ──────────────────────────────────────────────────

// In-memory mutable business state (mirrors BusinessResponse shape)
let mockBusiness = {
  id: 'tenant-001',
  name: 'Demo Business',
  slug: 'demo-business',
  plan: 'free' as 'free' | 'basic' | 'premium',
  address: null as string | null,
  phone: null as string | null,
  websiteUrl: null as string | null,
  branding: {
    primaryColor: null as string | null,
    bgColor: null as string | null,
    fontFamily: null as string | null,
    logoUrl: null as string | null,
    hidePoweredBy: false,
  },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// In-memory session state for the mock
let mockSession: { accessToken: string; user: typeof MOCK_USER } | null = null;

// Registered users store for the mock
const registeredUsers: Array<{ email: string; password: string; user: typeof MOCK_USER }> = [
  { email: 'demo@example.com', password: 'password', user: MOCK_USER },
];

function makeTokenResponse(user: typeof MOCK_USER) {
  const token = `mock-token-${Date.now()}`;
  mockSession = { accessToken: token, user };
  return { accessToken: token, user };
}

function respond<T>(body: T, status = 200) {
  return of(new HttpResponse({ status, body })).pipe(delay(300));
}

function unauthorized() {
  return throwError(() => ({
    status: 401,
    error: { title: 'Unauthorized', status: 401 },
  }));
}

function nowIso() {
  return new Date().toISOString();
}

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url;
  const method = req.method;

  // POST /auth/register
  if (method === 'POST' && url.endsWith('/auth/register')) {
    const body = req.body as { name: string; email: string; password: string; businessName: string };
    const existing = registeredUsers.find((u) => u.email === body.email);
    if (existing) {
      return throwError(() => ({
        status: 409,
        error: { title: 'Email already registered', status: 409 },
      }));
    }
    const newUser: typeof MOCK_USER = {
      userId: `user-${Date.now()}`,
      email: body.email,
      name: body.name,
      role: 'admin',
      tenantId: `tenant-${Date.now()}`,
    };
    registeredUsers.push({ email: body.email, password: body.password, user: newUser });
    return respond(makeTokenResponse(newUser));
  }

  // POST /auth/login
  if (method === 'POST' && url.endsWith('/auth/login')) {
    const body = req.body as { email: string; password: string };
    const found = registeredUsers.find(
      (u) => u.email === body.email && u.password === body.password
    );
    if (!found) {
      return throwError(() => ({
        status: 401,
        error: { title: 'Invalid email or password', status: 401 },
      }));
    }
    return respond(makeTokenResponse(found.user));
  }

  // POST /auth/refresh
  if (method === 'POST' && url.endsWith('/auth/refresh')) {
    if (!mockSession) {
      return unauthorized();
    }
    const newToken = `mock-token-${Date.now()}`;
    mockSession = { ...mockSession, accessToken: newToken };
    return respond({ accessToken: newToken });
  }

  // POST /auth/logout
  if (method === 'POST' && url.endsWith('/auth/logout')) {
    mockSession = null;
    return respond(null, 204);
  }

  // GET /admin/me
  if (method === 'GET' && url.endsWith('/admin/me')) {
    if (!mockSession) {
      return unauthorized();
    }
    return respond(mockSession.user);
  }

  // GET /admin/business
  if (method === 'GET' && url.endsWith('/admin/business')) {
    if (!mockSession) {
      return unauthorized();
    }
    return respond({ ...mockBusiness, branding: { ...mockBusiness.branding } });
  }

  // PUT /admin/business
  if (method === 'PUT' && url.endsWith('/admin/business')) {
    if (!mockSession) {
      return unauthorized();
    }
    const body = req.body as { name: string; address?: string; phone?: string; websiteUrl?: string };
    mockBusiness = {
      ...mockBusiness,
      name: body.name ?? mockBusiness.name,
      address: body.address ?? null,
      phone: body.phone ?? null,
      websiteUrl: body.websiteUrl ?? null,
      updatedAt: nowIso(),
    };
    return respond({ ...mockBusiness, branding: { ...mockBusiness.branding } });
  }

  // PATCH /admin/business/branding
  if (method === 'PATCH' && url.endsWith('/admin/business/branding')) {
    if (!mockSession) {
      return unauthorized();
    }
    const body = req.body as {
      primaryColor?: string;
      bgColor?: string;
      fontFamily?: string;
      hidePoweredBy?: boolean;
    };
    mockBusiness = {
      ...mockBusiness,
      branding: {
        primaryColor: body.primaryColor ?? mockBusiness.branding.primaryColor,
        bgColor: body.bgColor ?? mockBusiness.branding.bgColor,
        fontFamily: body.fontFamily ?? mockBusiness.branding.fontFamily,
        logoUrl: mockBusiness.branding.logoUrl,
        hidePoweredBy: body.hidePoweredBy ?? mockBusiness.branding.hidePoweredBy,
      },
      updatedAt: nowIso(),
    };
    return respond({ ...mockBusiness, branding: { ...mockBusiness.branding } });
  }

  // POST /admin/business/logo
  if (method === 'POST' && url.endsWith('/admin/business/logo')) {
    if (!mockSession) {
      return unauthorized();
    }
    mockBusiness = {
      ...mockBusiness,
      branding: {
        ...mockBusiness.branding,
        logoUrl: 'https://placehold.co/200x80?text=Logo',
      },
      updatedAt: nowIso(),
    };
    return respond({ ...mockBusiness, branding: { ...mockBusiness.branding } });
  }

  // DELETE /admin/business/logo
  if (method === 'DELETE' && url.endsWith('/admin/business/logo')) {
    if (!mockSession) {
      return unauthorized();
    }
    mockBusiness = {
      ...mockBusiness,
      branding: {
        ...mockBusiness.branding,
        logoUrl: null,
      },
      updatedAt: nowIso(),
    };
    return respond(null, 204);
  }

  // GET /public/{tenantSlug}/branding — must come BEFORE the public forms handlers
  if (method === 'GET' && url.includes('/public/') && url.endsWith('/branding')) {
    const publicBranding = {
      tenantName: mockBusiness.name,
      primaryColor: mockBusiness.branding.primaryColor,
      bgColor: mockBusiness.branding.bgColor,
      fontFamily: mockBusiness.branding.fontFamily,
      logoUrl: mockBusiness.branding.logoUrl,
      hidePoweredBy: mockBusiness.branding.hidePoweredBy,
    };
    return respond(publicBranding);
  }

  // GET /public/{slug}/forms/{formId} — public form fetch (no auth)
  if (method === 'GET' && url.includes('/public/') && url.includes('/forms/')) {
    const parts = url.split('/forms/');
    const formId = parts[1]?.split('?')[0];
    const form = formId ? mockFormDetails.get(formId) : null;
    if (!form) return respond(null, 404);
    if (form.status !== 'published') return respond({ title: 'Form not available', status: 403 }, 403);
    return respond({ ...form, fields: [...form.fields] });
  }

  // POST /public/{slug}/forms/{formId}/submit
  if (method === 'POST' && url.includes('/public/') && url.endsWith('/submit')) {
    const parts = url.split('/forms/');
    const formId = parts[1]?.replace('/submit', '');
    const form = formId ? mockFormDetails.get(formId) : null;
    if (!form) return respond(null, 404);
    const body = req.body as { answers: Record<string, any>; signatureData?: string };
    const now = nowIso();
    const submission: any = {
      id: `sub-${Date.now()}`,
      formId,
      submitterName: Object.values(body.answers ?? {})[0]?.toString() ?? null,
      submitterEmail: null,
      formData: body.answers ?? {},
      signatureUrl: null,
      status: 'pending',
      submittedAt: now,
    };
    mockSubmissions = [...mockSubmissions, submission];
    return respond(submission, 201);
  }

  // ─── Templates routes ─────────────────────────────────────────────────────

  // GET /admin/templates  (list, with optional ?category=)
  if (method === 'GET' && url.includes('/admin/templates') && /\/admin\/templates(\?.*)?$/.test(url)) {
    if (!mockSession) return unauthorized();
    const urlObj = new URL(url, 'http://localhost');
    const category = urlObj.searchParams.get('category');
    const filtered = category
      ? MOCK_TEMPLATES.filter(t => t.category === category)
      : MOCK_TEMPLATES;
    const page: PageResponse<import('../../features/templates/template.model').TemplateSummary> = {
      content: filtered,
      page: 0, size: 20, totalElements: filtered.length, totalPages: 1, first: true, last: true,
    };
    return respond(page);
  }

  // POST /admin/templates/{id}/import
  if (method === 'POST' && url.includes('/admin/templates/') && url.endsWith('/import')) {
    if (!mockSession) return unauthorized();
    const tplId = url.split('/admin/templates/')[1].replace('/import', '');
    const tpl = MOCK_TEMPLATE_DETAILS.get(tplId);
    if (!tpl) return respond(null, 404);
    const now = nowIso();
    const newId = `form-${Date.now()}`;
    const newForm: any = {
      id: newId,
      name: tpl.name,
      description: tpl.description,
      status: 'draft',
      fields: tpl.fields.map((f: any, i: number) => ({ ...f, id: `${newId}-f${i}` })),
      createdAt: now,
      updatedAt: now,
    };
    const newSummary: any = {
      id: newId,
      name: tpl.name,
      description: tpl.description,
      status: 'draft',
      fieldCount: tpl.fields.length,
      createdAt: now,
      updatedAt: now,
    };
    mockForms = [...mockForms, newSummary];
    mockFormDetails.set(newId, newForm);
    return respond(newForm, 201);
  }

  // GET /admin/templates/{id}
  if (method === 'GET' && url.includes('/admin/templates/') && /\/admin\/templates\/[^/?]+$/.test(url)) {
    if (!mockSession) return unauthorized();
    const tplId = url.split('/admin/templates/')[1].split('?')[0];
    const tpl = MOCK_TEMPLATE_DETAILS.get(tplId);
    if (!tpl) return respond(null, 404);
    return respond(tpl);
  }

  // ─── End templates routes ──────────────────────────────────────────────────

  // ─── Submissions admin routes ─────────────────────────────────────────────

  // GET /admin/submissions (list)
  if (method === 'GET' && url.includes('/admin/submissions') && /\/admin\/submissions(\?.*)?$/.test(url)) {
    if (!mockSession) return unauthorized();
    const page: PageResponse<any> = {
      content: [...mockSubmissions],
      page: 0, size: 20, totalElements: mockSubmissions.length, totalPages: 1, first: true, last: true,
    };
    return respond(page);
  }

  // GET /admin/submissions/{id}
  if (method === 'GET' && url.includes('/admin/submissions/') && /\/admin\/submissions\/[^/?]+$/.test(url)) {
    if (!mockSession) return unauthorized();
    const id = url.split('/admin/submissions/')[1].split('?')[0];
    const sub = mockSubmissions.find(s => s.id === id);
    if (!sub) return respond(null, 404);
    return respond(sub);
  }

  // ─── End submissions admin routes ─────────────────────────────────────────

  // ─── Forms routes ─────────────────────────────────────────────────────────

  const isFormsBase = url.includes('/admin/forms') && !url.includes('/admin/business');

  // POST /admin/forms/{id}/duplicate
  if (method === 'POST' && isFormsBase && url.includes('/admin/forms/') && url.endsWith('/duplicate')) {
    if (!mockSession) return unauthorized();
    const formId = url.split('/admin/forms/')[1].replace('/duplicate', '');
    const original = mockFormDetails.get(formId);
    if (!original) return respond(null, 404);
    const now = nowIso();
    const newId = `form-${Date.now()}`;
    const copy: any = {
      ...original,
      id: newId,
      name: `Copy of ${original.name}`,
      status: 'draft',
      fields: original.fields.map((f: any, i: number) => ({ ...f, id: `${newId}-f${i}` })),
      createdAt: now,
      updatedAt: now,
    };
    const copySummary: any = {
      id: newId,
      name: copy.name,
      description: copy.description,
      status: 'draft',
      fieldCount: copy.fields.length,
      createdAt: now,
      updatedAt: now,
    };
    mockForms = [...mockForms, copySummary];
    mockFormDetails.set(newId, copy);
    return respond(copy, 201);
  }

  // GET /admin/forms  (list)
  if (method === 'GET' && isFormsBase && /\/admin\/forms(\?.*)?$/.test(url)) {
    if (!mockSession) return unauthorized();
    const page: PageResponse<FormSummary> = {
      content: [...mockForms],
      page: 0,
      size: 20,
      totalElements: mockForms.length,
      totalPages: 1,
      first: true,
      last: true,
    };
    return respond(page);
  }

  // POST /admin/forms  (create)
  if (method === 'POST' && isFormsBase && /\/admin\/forms$/.test(url)) {
    if (!mockSession) return unauthorized();
    const body = req.body as { name: string; description?: string | null };
    const now = nowIso();
    const newId = `form-${Date.now()}`;
    const newForm: Form = {
      id: newId,
      name: body.name,
      description: body.description ?? null,
      status: 'draft',
      fields: [],
      createdAt: now,
      updatedAt: now,
    };
    const newSummary: FormSummary = {
      id: newId,
      name: body.name,
      description: body.description ?? null,
      status: 'draft',
      fieldCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    mockForms = [...mockForms, newSummary];
    mockFormDetails.set(newId, newForm);
    return respond(newForm, 201);
  }

  // POST /admin/forms/{id}/publish
  if (method === 'POST' && isFormsBase && /\/admin\/forms\/[^/]+\/publish$/.test(url)) {
    if (!mockSession) return unauthorized();
    const id = url.split('/admin/forms/')[1].replace('/publish', '');
    const form = mockFormDetails.get(id);
    if (!form) return respond(null, 404);
    const updated: Form = { ...form, status: 'published', updatedAt: nowIso() };
    mockFormDetails.set(id, updated);
    mockForms = mockForms.map((f) => (f.id === id ? { ...f, status: 'published', updatedAt: updated.updatedAt } : f));
    return respond(updated);
  }

  // POST /admin/forms/{id}/unpublish
  if (method === 'POST' && isFormsBase && /\/admin\/forms\/[^/]+\/unpublish$/.test(url)) {
    if (!mockSession) return unauthorized();
    const id = url.split('/admin/forms/')[1].replace('/unpublish', '');
    const form = mockFormDetails.get(id);
    if (!form) return respond(null, 404);
    const updated: Form = { ...form, status: 'draft', updatedAt: nowIso() };
    mockFormDetails.set(id, updated);
    mockForms = mockForms.map((f) => (f.id === id ? { ...f, status: 'draft', updatedAt: updated.updatedAt } : f));
    return respond(updated);
  }

  // GET /admin/forms/{id}
  if (method === 'GET' && isFormsBase && /\/admin\/forms\/[^/?]+$/.test(url)) {
    if (!mockSession) return unauthorized();
    const id = url.split('/admin/forms/')[1].split('?')[0];
    const form = mockFormDetails.get(id);
    if (!form) return respond(null, 404);
    return respond({ ...form, fields: [...form.fields] });
  }

  // PUT /admin/forms/{id}
  if (method === 'PUT' && isFormsBase && /\/admin\/forms\/[^/]+$/.test(url)) {
    if (!mockSession) return unauthorized();
    const id = url.split('/admin/forms/')[1];
    const existing = mockFormDetails.get(id);
    if (!existing) return respond(null, 404);
    const body = req.body as { name: string; description: string | null; fields: FormField[] };
    const now = nowIso();
    const updated: Form = {
      ...existing,
      name: body.name,
      description: body.description,
      fields: body.fields ?? existing.fields,
      updatedAt: now,
    };
    mockFormDetails.set(id, updated);
    mockForms = mockForms.map((f) =>
      f.id === id
        ? { ...f, name: updated.name, description: updated.description, fieldCount: updated.fields.length, updatedAt: now }
        : f
    );
    return respond({ ...updated, fields: [...updated.fields] });
  }

  // DELETE /admin/forms/{id}
  if (method === 'DELETE' && isFormsBase && /\/admin\/forms\/[^/]+$/.test(url)) {
    if (!mockSession) return unauthorized();
    const id = url.split('/admin/forms/')[1];
    mockForms = mockForms.filter((f) => f.id !== id);
    mockFormDetails.delete(id);
    return respond(null, 204);
  }

  // ─── End forms routes ──────────────────────────────────────────────────────

  // Pass through anything not matched (shouldn't happen in mock mode)
  return next(req);
};
