import { Routes } from '@angular/router';

export const formsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./form-list/form-list.component').then(
        (m) => m.FormListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./form-builder/form-builder.component').then(
        (m) => m.FormBuilderComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./form-builder/form-builder.component').then(
        (m) => m.FormBuilderComponent
      ),
  },
  {
    path: ':id/preview',
    loadComponent: () =>
      import('./form-preview/form-preview.component').then(
        (m) => m.FormPreviewComponent
      ),
  },
];
