import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../layout/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'forms',
        loadChildren: () =>
          import('./forms/forms.routes').then((m) => m.formsRoutes),
      },
      {
        path: 'submissions',
        loadChildren: () =>
          import('./submissions/submissions.routes').then(
            (m) => m.submissionsRoutes
          ),
      },
      {
        path: 'templates',
        loadComponent: () =>
          import('./templates/template-gallery/template-gallery.component').then(
            (m) => m.TemplateGalleryComponent
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./analytics/analytics.component').then(
            (m) => m.AnalyticsComponent
          ),
      },
      {
        path: 'analytics/forms/:id',
        loadComponent: () =>
          import('./analytics/form-analytics.component').then(
            (m) => m.FormAnalyticsComponent
          ),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./billing/billing.component').then(
            (m) => m.BillingComponent
          ),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./settings/settings.routes').then(
            (m) => m.settingsRoutes
          ),
      },
    ],
  },
];
