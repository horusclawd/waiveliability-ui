import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'branding',
    loadComponent: () =>
      import('./branding/branding.component').then(
        (m) => m.BrandingComponent
      ),
  },
  {
    path: 'team',
    loadComponent: () =>
      import('./team/team.component').then((m) => m.TeamComponent),
  },
  {
    path: 'domain',
    loadComponent: () =>
      import('./domain/domain.component').then((m) => m.DomainComponent),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./notifications/notifications.component').then(
        (m) => m.NotificationsComponent
      ),
  },
];
