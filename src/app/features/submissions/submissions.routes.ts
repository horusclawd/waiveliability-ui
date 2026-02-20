import { Routes } from '@angular/router';

export const submissionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./submission-list/submission-list.component').then(
        (m) => m.SubmissionListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./submission-detail/submission-detail.component').then(
        (m) => m.SubmissionDetailComponent
      ),
  },
];
