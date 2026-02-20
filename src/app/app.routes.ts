import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'admin', pathMatch: 'full' },

  // Public form routes — no auth, own layout, no admin chrome
  {
    path: 'f/:tenantSlug/:formId',
    loadComponent: () =>
      import('./public/form-view/form-view.component').then(
        (m) => m.FormViewComponent
      ),
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
