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

  // GET /public/{tenantSlug}/branding
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

  // ─── Forms routes ─────────────────────────────────────────────────────────

  const isFormsBase = url.includes('/admin/forms') && !url.includes('/admin/business');

  // GET /admin/forms  (list)
  if (method === 'GET' && isFormsBase && /\/admin\/forms(\?.*)?$/.test(url)) {
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
    const id = url.split('/admin/forms/')[1].split('?')[0];
    const form = mockFormDetails.get(id);
    if (!form) return respond(null, 404);
    return respond({ ...form, fields: [...form.fields] });
  }

  // PUT /admin/forms/{id}
  if (method === 'PUT' && isFormsBase && /\/admin\/forms\/[^/]+$/.test(url)) {
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
    const id = url.split('/admin/forms/')[1];
    mockForms = mockForms.filter((f) => f.id !== id);
    mockFormDetails.delete(id);
    return respond(null, 204);
  }

  // ─── End forms routes ──────────────────────────────────────────────────────

  // Pass through anything not matched (shouldn't happen in mock mode)
  return next(req);
};
