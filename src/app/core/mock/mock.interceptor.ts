import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

// Canned mock data
const MOCK_USER = {
  userId: 'user-001',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'admin',
  tenantId: 'tenant-001',
};

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

  // Pass through anything not matched (shouldn't happen in mock mode)
  return next(req);
};
