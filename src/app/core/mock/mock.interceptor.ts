import { HttpInterceptorFn, HttpResponse, HttpHeaders } from '@angular/common/http';
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
  { id: 'f001-f1', fieldType: 'content', label: 'Legal Waiver Terms', placeholder: null, required: false, fieldOrder: 0, options: null, content: 'This is a legal waiver form. By signing below, you agree to release the company from any liability for injuries or damages that may occur during the event.' },
  { id: 'f001-f2', fieldType: 'text',  label: 'Full Name',  placeholder: 'Enter your name',  required: true,  fieldOrder: 1, options: null, content: null },
  { id: 'f001-f3', fieldType: 'email', label: 'Email',      placeholder: 'Enter your email', required: true,  fieldOrder: 2, options: null, content: null },
  { id: 'f001-f4', fieldType: 'text',  label: 'Signature',  placeholder: 'Type your signature', required: true, fieldOrder: 3, options: null, content: null },
];

const SEED_FORM_2_FIELDS: FormField[] = [
  { id: 'f002-f1', fieldType: 'text',     label: 'Full Name', placeholder: 'Enter your name', required: true,  fieldOrder: 0, options: null, content: null },
  { id: 'f002-f2', fieldType: 'checkbox', label: 'I agree to the terms', placeholder: null,  required: true,  fieldOrder: 1, options: null, content: null },
];

const STORAGE_KEY_FORMS = 'mock_forms';
const STORAGE_KEY_FORM_DETAILS = 'mock_form_details';

// Load from localStorage or use defaults
function loadMockData() {
  try {
    const storedForms = localStorage.getItem(STORAGE_KEY_FORMS);
    const storedDetails = localStorage.getItem(STORAGE_KEY_FORM_DETAILS);

    if (storedForms && storedDetails) {
      const forms = JSON.parse(storedForms);
      const detailsMap = new Map<string, Form>(JSON.parse(storedDetails));
      return { forms, detailsMap };
    }
  } catch (e) {
    console.warn('[MOCK] Failed to load from localStorage:', e);
  }

  // Default seed data
  const defaultForms: FormSummary[] = [
    {
      id: 'form-001',
      name: 'Customer Waiver',
      description: 'Standard customer waiver form',
      status: 'published',
      fieldCount: 4,
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

  const defaultDetails = new Map<string, Form>([
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

  return { forms: defaultForms, detailsMap: defaultDetails };
}

// Persist to localStorage
function saveMockData(forms: FormSummary[], detailsMap: Map<string, Form>) {
  try {
    localStorage.setItem(STORAGE_KEY_FORMS, JSON.stringify(forms));
    localStorage.setItem(STORAGE_KEY_FORM_DETAILS, JSON.stringify([...detailsMap]));
  } catch (e) {
    console.warn('[MOCK] Failed to save to localStorage:', e);
  }
}

// Initialize mock data
const { forms: initialForms, detailsMap: initialDetails } = loadMockData();
let mockForms: FormSummary[] = initialForms;
let mockFormDetails: Map<string, Form> = initialDetails;

// ─── End forms mock data ──────────────────────────────────────────────────────

// ─── Submissions mock data ────────────────────────────────────────────────────

let mockSubmissions: any[] = [
  {
    id: 'sub-001',
    formId: 'form-001',
    submitterName: 'Alice Johnson',
    submitterEmail: 'alice@example.com',
    formData: { 'Full Name': 'Alice Johnson', 'Email': 'alice@example.com', 'Signature': 'Alice Johnson' },
    signatureUrl: null,
    pdfUrl: 'https://placehold.co/800x1100?text=Alice+Waiver+PDF',
    status: 'pending',
    submittedAt: '2026-02-10T14:30:00Z',
  },
  {
    id: 'sub-002',
    formId: 'form-001',
    submitterName: 'Bob Smith',
    submitterEmail: 'bob@example.com',
    formData: { 'Full Name': 'Bob Smith', 'Email': 'bob@example.com', 'Signature': 'Bob Smith' },
    signatureUrl: null,
    pdfUrl: 'https://placehold.co/800x1100?text=Bob+Waiver+PDF',
    status: 'reviewed',
    submittedAt: '2026-02-12T09:15:00Z',
  },
  {
    id: 'sub-003',
    formId: 'form-001',
    submitterName: 'Carol Davis',
    submitterEmail: 'carol@example.com',
    formData: { 'Full Name': 'Carol Davis', 'Email': 'carol@example.com', 'Signature': 'Carol Davis' },
    signatureUrl: null,
    pdfUrl: 'https://placehold.co/800x1100?text=Carol+Waiver+PDF',
    status: 'archived',
    submittedAt: '2026-02-05T16:45:00Z',
  },
  {
    id: 'sub-004',
    formId: 'form-002',
    submitterName: 'Dan Wilson',
    submitterEmail: 'dan@example.com',
    formData: { 'Full Name': 'Dan Wilson', 'I agree to the terms': true },
    signatureUrl: null,
    pdfUrl: 'https://placehold.co/800x1100?text=Dan+Release+PDF',
    status: 'pending',
    submittedAt: '2026-02-18T11:00:00Z',
  },
  {
    id: 'sub-005',
    formId: 'form-001',
    submitterName: 'Eve Martinez',
    submitterEmail: 'eve@example.com',
    formData: { 'Full Name': 'Eve Martinez', 'Email': 'eve@example.com', 'Signature': 'Eve Martinez' },
    signatureUrl: null,
    pdfUrl: null,
    status: 'pending',
    submittedAt: '2026-02-19T08:20:00Z',
  },
];

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
    { id: 'tf-001-1', fieldType: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true, fieldOrder: 0, options: null, content: null },
    { id: 'tf-001-2', fieldType: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true, fieldOrder: 1, options: null, content: null },
    { id: 'tf-001-3', fieldType: 'text', label: 'Signature', placeholder: 'Type your full name as signature', required: true, fieldOrder: 2, options: null, content: null },
  ], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
  ['tpl-002', { id: 'tpl-002', name: 'Activity Release', description: 'Activity participation release with emergency contact', category: 'waiver', isPremium: false, usageCount: 89, fields: [
    { id: 'tf-002-1', fieldType: 'text', label: 'Participant Name', placeholder: 'Full name', required: true, fieldOrder: 0, options: null, content: null },
    { id: 'tf-002-2', fieldType: 'email', label: 'Email', placeholder: 'Email address', required: true, fieldOrder: 1, options: null, content: null },
    { id: 'tf-002-3', fieldType: 'text', label: 'Emergency Contact', placeholder: 'Name and phone number', required: true, fieldOrder: 2, options: null, content: null },
    { id: 'tf-002-4', fieldType: 'checkbox', label: 'I agree to the terms and conditions', placeholder: null, required: true, fieldOrder: 3, options: null, content: null },
  ], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
  ['tpl-003', { id: 'tpl-003', name: 'NDA Agreement', description: 'Non-disclosure agreement with terms checkbox', category: 'legal', isPremium: true, usageCount: 56, fields: [
    { id: 'tf-003-1', fieldType: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true, fieldOrder: 0, options: null, content: null },
    { id: 'tf-003-2', fieldType: 'text', label: 'Company Name', placeholder: 'Your company or organization', required: false, fieldOrder: 1, options: null, content: null },
    { id: 'tf-003-3', fieldType: 'email', label: 'Email', placeholder: 'Enter your email', required: true, fieldOrder: 2, options: null, content: null },
    { id: 'tf-003-4', fieldType: 'checkbox', label: 'I agree to the terms of this NDA', placeholder: null, required: true, fieldOrder: 3, options: null, content: null },
  ], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
  ['tpl-004', { id: 'tpl-004', name: 'Photo Release', description: 'Photo and media release consent form', category: 'consent', isPremium: false, usageCount: 73, fields: [
    { id: 'tf-004-1', fieldType: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true, fieldOrder: 0, options: null, content: null },
    { id: 'tf-004-2', fieldType: 'email', label: 'Email', placeholder: 'Enter your email', required: true, fieldOrder: 1, options: null, content: null },
    { id: 'tf-004-3', fieldType: 'checkbox', label: 'I grant permission to use my photo/likeness', placeholder: null, required: true, fieldOrder: 2, options: null, content: null },
    { id: 'tf-004-4', fieldType: 'text', label: 'Signature', placeholder: 'Type your full name', required: true, fieldOrder: 3, options: null, content: null },
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
  notificationsEnabled: false,
  notificationEmail: null as string | null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// In-memory notification settings (separate from business for cleaner API)
let mockNotificationSettings = {
  notificationsEnabled: false,
  notificationEmail: null as string | null,
};

// In-memory session state for the mock
let mockSession: { accessToken: string; user: typeof MOCK_USER } | null = null;

// Registered users store for the mock
const registeredUsers: Array<{ email: string; password: string; user: typeof MOCK_USER }> = [
  { email: 'demo@example.com', password: 'password', user: MOCK_USER },
];

// ─── Team mock data ──────────────────────────────────────────────────────────

let mockTeamMembers: Array<{
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
}> = [
  {
    userId: 'user-001',
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    userId: 'user-002',
    name: 'Jane Editor',
    email: 'jane@example.com',
    role: 'editor',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    userId: 'user-003',
    name: 'Bob Viewer',
    email: 'bob@example.com',
    role: 'viewer',
    createdAt: '2026-02-01T00:00:00Z',
  },
];

let mockTeamInvites: Array<{
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
}> = [
  {
    id: 'invite-001',
    email: 'newuser@example.com',
    role: 'editor',
    invitedBy: 'Demo User',
    invitedAt: '2026-02-10T10:00:00Z',
    expiresAt: '2026-02-17T10:00:00Z',
  },
];

// ─── End team mock data ──────────────────────────────────────────────────────

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
    return respond({
      ...mockBusiness,
      branding: { ...mockBusiness.branding },
      notificationsEnabled: mockBusiness.notificationsEnabled,
      notificationEmail: mockBusiness.notificationEmail,
    });
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

  // GET /admin/settings/notifications
  if (method === 'GET' && url.endsWith('/admin/settings/notifications')) {
    if (!mockSession) {
      return unauthorized();
    }
    return respond({ ...mockNotificationSettings });
  }

  // PUT /admin/settings/notifications
  if (method === 'PUT' && url.endsWith('/admin/settings/notifications')) {
    if (!mockSession) {
      return unauthorized();
    }
    const body = req.body as { notificationsEnabled: boolean; notificationEmail: string | null };
    mockNotificationSettings = {
      notificationsEnabled: body.notificationsEnabled ?? mockNotificationSettings.notificationsEnabled,
      notificationEmail: body.notificationEmail ?? mockNotificationSettings.notificationEmail,
    };
    // Also update the business object to reflect changes
    mockBusiness = {
      ...mockBusiness,
      notificationsEnabled: mockNotificationSettings.notificationsEnabled,
      notificationEmail: mockNotificationSettings.notificationEmail,
      updatedAt: nowIso(),
    };
    return respond({ ...mockNotificationSettings });
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
    const response = { ...form, fields: [...form.fields] };
    return respond(response);
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
      pdfUrl: 'https://placehold.co/800x1100?text=Submission+PDF',
      status: 'pending',
      submittedAt: now,
    };
    mockSubmissions = [...mockSubmissions, submission];
    return respond(submission, 201);
  }

  // GET /public/{slug}/submissions/{submissionId} — get submission with PDF
  if (method === 'GET' && url.includes('/public/') && url.includes('/submissions/')) {
    const match = url.match(/\/public\/([^/]+)\/submissions\/([^/]+)/);
    const submissionId = match ? match[2] : null;
    const submission = submissionId ? mockSubmissions.find(s => s.id === submissionId) : null;
    if (!submission) {
      // Create a mock submission with PDF ready for demo
      return respond({
        id: submissionId,
        formId: 'mock-form-id',
        submitterName: 'Test User',
        submitterEmail: 'test@example.com',
        formData: {},
        signatureUrl: null,
        pdfUrl: 'https://placehold.co/800x1100?text=Submission+PDF',
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });
    }
    return respond(submission);
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
    saveMockData(mockForms, mockFormDetails);
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

  // GET /admin/submissions/export (CSV) — must come before the general GET list
  if (method === 'GET' && url.includes('/admin/submissions/export')) {
    if (!mockSession) return unauthorized();
    const csv = [
      'id,form_id,submitter_name,submitter_email,status,submitted_at',
      ...mockSubmissions.map(s =>
        `${s.id},${s.formId},${s.submitterName ?? ''},${s.submitterEmail ?? ''},${s.status},${s.submittedAt}`
      )
    ].join('\n');
    return of(new HttpResponse({ body: csv, status: 200, headers: new HttpHeaders({ 'Content-Type': 'text/csv' }) })).pipe(delay(300));
  }

  // PATCH /admin/submissions/:id/status
  if (method === 'PATCH' && /\/admin\/submissions\/[^/?]+\/status$/.test(url)) {
    if (!mockSession) return unauthorized();
    const id = url.split('/admin/submissions/')[1].split('/status')[0];
    const body = req.body as { status: string };
    const idx = mockSubmissions.findIndex(s => s.id === id);
    if (idx === -1) return respond(null, 404);
    mockSubmissions[idx] = { ...mockSubmissions[idx], status: body.status };
    return respond(mockSubmissions[idx]);
  }

  // DELETE /admin/submissions/:id
  if (method === 'DELETE' && /\/admin\/submissions\/[^/?]+$/.test(url)) {
    if (!mockSession) return unauthorized();
    const id = url.split('/admin/submissions/')[1].split('?')[0];
    mockSubmissions = mockSubmissions.filter(s => s.id !== id);
    return respond(null, 204);
  }

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
    saveMockData(mockForms, mockFormDetails);
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
    saveMockData(mockForms, mockFormDetails);
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
    saveMockData(mockForms, mockFormDetails);
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
    saveMockData(mockForms, mockFormDetails);
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
    // Persist to localStorage
    saveMockData(mockForms, mockFormDetails);
    return respond({ ...updated, fields: [...updated.fields] });
  }

  // DELETE /admin/forms/{id}
  if (method === 'DELETE' && isFormsBase && /\/admin\/forms\/[^/]+$/.test(url)) {
    if (!mockSession) return unauthorized();
    const id = url.split('/admin/forms/')[1];
    mockForms = mockForms.filter((f) => f.id !== id);
    mockFormDetails.delete(id);
    saveMockData(mockForms, mockFormDetails);
    return respond(null, 204);
  }

  // ─── End forms routes ──────────────────────────────────────────────────────

  // ─── Billing routes ───────────────────────────────────────────────────────

  // GET /admin/billing/subscription
  if (method === 'GET' && url.endsWith('/admin/billing/subscription')) {
    if (!mockSession) return unauthorized();
    const subscription = {
      plan: mockBusiness.plan,
      status: mockBusiness.plan === 'free' ? null : 'active',
      currentPeriodEnd: mockBusiness.plan === 'free' ? null : '2026-03-20T00:00:00Z',
      cancelAtPeriodEnd: false,
    };
    return respond(subscription);
  }

  // GET /admin/billing/limits
  if (method === 'GET' && url.endsWith('/admin/billing/limits')) {
    if (!mockSession) return unauthorized();
    const limits = {
      forms: { used: 5, limit: mockBusiness.plan === 'free' ? 3 : mockBusiness.plan === 'basic' ? 10 : -1 },
      submissions: { used: 100, limit: mockBusiness.plan === 'free' ? 100 : mockBusiness.plan === 'basic' ? 1000 : -1 },
    };
    return respond(limits);
  }

  // POST /admin/billing/checkout
  if (method === 'POST' && url.endsWith('/admin/billing/checkout')) {
    if (!mockSession) return unauthorized();
    const body = req.body as { planId: string };
    // Simulate redirecting to Stripe checkout
    const checkoutUrl = `https://checkout.stripe.com/mock?plan=${body.planId}`;
    return respond({ url: checkoutUrl });
  }

  // POST /admin/billing/portal
  if (method === 'POST' && url.endsWith('/admin/billing/portal')) {
    if (!mockSession) return unauthorized();
    const portalUrl = 'https://billing.stripe.com/mock/portal';
    return respond({ url: portalUrl });
  }

  // ─── End billing routes ─────────────────────────────────────────────────────

  // ─── Analytics routes ─────────────────────────────────────────────────────

  // GET /admin/analytics/overview
  if (method === 'GET' && url.endsWith('/admin/analytics/overview')) {
    if (!mockSession) return unauthorized();

    // Generate last 30 days of data
    const today = new Date();
    const submissionsByDay: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      // Generate some random counts with some trend
      const baseCount = 3 + Math.floor(Math.random() * 5);
      submissionsByDay.push({ date: dateStr, count: baseCount });
    }

    // Count by status from mockSubmissions
    const pendingCount = mockSubmissions.filter(s => s.status === 'pending').length;
    const reviewedCount = mockSubmissions.filter(s => s.status === 'reviewed').length;
    const archivedCount = mockSubmissions.filter(s => s.status === 'archived').length;

    // Get form names for recent submissions
    const recentSubmissions = mockSubmissions
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        formId: s.formId,
        formName: mockFormDetails.get(s.formId)?.name ?? 'Unknown Form',
        submitterName: s.submitterName,
        submitterEmail: s.submitterEmail,
        status: s.status,
        submittedAt: s.submittedAt,
      }));

    const overview = {
      totalSubmissions: mockSubmissions.length,
      pendingCount,
      reviewedCount,
      archivedCount,
      submissionsByDay,
      submissionsByStatus: [
        { status: 'pending', count: pendingCount },
        { status: 'reviewed', count: reviewedCount },
        { status: 'archived', count: archivedCount },
      ],
      recentSubmissions,
    };
    return respond(overview);
  }

  // GET /admin/analytics/forms/:formId
  if (method === 'GET' && /\/admin\/analytics\/forms\/[^/?]+$/.test(url)) {
    if (!mockSession) return unauthorized();
    const formId = url.split('/admin/analytics/forms/')[1].split('?')[0];
    const form = mockFormDetails.get(formId);

    if (!form) return respond(null, 404);

    // Filter submissions for this form
    const formSubmissions = mockSubmissions.filter(s => s.formId === formId);

    // Generate trend data for last 30 days
    const today = new Date();
    const submissionsTrend: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySubmissions = formSubmissions.filter(s =>
        s.submittedAt.startsWith(dateStr)
      );
      submissionsTrend.push({ date: dateStr, count: daySubmissions.length });
    }

    const pendingCount = formSubmissions.filter(s => s.status === 'pending').length;
    const reviewedCount = formSubmissions.filter(s => s.status === 'reviewed').length;
    const archivedCount = formSubmissions.filter(s => s.status === 'archived').length;

    const formAnalytics = {
      formId,
      formName: form.name,
      totalSubmissions: formSubmissions.length,
      pendingCount,
      reviewedCount,
      archivedCount,
      submissionsTrend,
      statusBreakdown: [
        { status: 'pending', count: pendingCount },
        { status: 'reviewed', count: reviewedCount },
        { status: 'archived', count: archivedCount },
      ],
    };
    return respond(formAnalytics);
  }

  // ─── End analytics routes ─────────────────────────────────────────────────

  // ─── Team management routes ─────────────────────────────────────────────

  // GET /admin/team - list team members
  if (method === 'GET' && url.endsWith('/admin/team')) {
    if (!mockSession) return unauthorized();
    return respond([...mockTeamMembers]);
  }

  // POST /admin/team/invite - create invite
  if (method === 'POST' && url.endsWith('/admin/team/invite')) {
    if (!mockSession) return unauthorized();
    const body = req.body as { email: string; role: 'admin' | 'editor' | 'viewer' };
    const newInvite = {
      id: `invite-${Date.now()}`,
      email: body.email,
      role: body.role,
      invitedBy: mockSession.user.name,
      invitedAt: nowIso(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    mockTeamInvites.push(newInvite);
    return respond(newInvite, 201);
  }

  // GET /admin/team/invites - list pending invites
  if (method === 'GET' && url.endsWith('/admin/team/invites')) {
    if (!mockSession) return unauthorized();
    return respond([...mockTeamInvites]);
  }

  // DELETE /admin/team/invites/{id} - cancel invite
  if (method === 'DELETE' && /\/admin\/team\/invites\/[^/]+$/.test(url)) {
    if (!mockSession) return unauthorized();
    const inviteId = url.split('/admin/team/invites/')[1];
    const idx = mockTeamInvites.findIndex(i => i.id === inviteId);
    if (idx === -1) return respond(null, 404);
    mockTeamInvites.splice(idx, 1);
    return respond(null, 204);
  }

  // PATCH /admin/team/{userId} - update member role
  if (method === 'PATCH' && /\/admin\/team\/[^/]+$/.test(url) && !url.includes('/invites')) {
    if (!mockSession) return unauthorized();
    const userId = url.split('/admin/team/')[1];
    const body = req.body as { role: 'admin' | 'editor' | 'viewer' };
    const memberIdx = mockTeamMembers.findIndex(m => m.userId === userId);
    if (memberIdx === -1) return respond(null, 404);
    mockTeamMembers[memberIdx] = { ...mockTeamMembers[memberIdx], role: body.role };
    return respond(mockTeamMembers[memberIdx]);
  }

  // DELETE /admin/team/{userId} - remove member
  if (method === 'DELETE' && /\/admin\/team\/[^/]+$/.test(url) && !url.includes('/invites')) {
    if (!mockSession) return unauthorized();
    const userId = url.split('/admin/team/')[1];
    const idx = mockTeamMembers.findIndex(m => m.userId === userId);
    if (idx === -1) return respond(null, 404);
    mockTeamMembers.splice(idx, 1);
    return respond(null, 204);
  }

  // ─── End team management routes ─────────────────────────────────────────

  // Pass through anything not matched (shouldn't happen in mock mode)
  return next(req);
};
