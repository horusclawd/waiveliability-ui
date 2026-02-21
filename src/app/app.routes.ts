import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Landing page
  {
    path: '',
    loadComponent: () =>
      import('./features/public/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },

  // Public form routes — no auth, own layout, no admin chrome
  {
    path: 'f/:tenantSlug/:formId',
    loadComponent: () =>
      import('./public/form-view/form-view.component').then(
        (m) => m.FormViewComponent
      ),
  },

  // New public form routes for Sprint 5
  {
    path: 'public/:tenantSlug/forms/:formId',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/public/public-form/public-form.component').then(
            (m) => m.PublicFormComponent
          ),
      },
      {
        path: 'confirmation',
        loadComponent: () =>
          import('./features/public/public-confirmation/public-confirmation.component').then(
            (m) => m.PublicConfirmationComponent
          ),
      },
    ],
  },

  // Auth routes (unauthenticated layout)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },

  // Admin portal (authenticated, lazy)
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/admin.routes').then((m) => m.adminRoutes),
  },

  // Catch-all
  { path: '**', redirectTo: 'admin' },
];
