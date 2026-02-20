import { Routes } from '@angular/router';
import { unsavedChangesGuard } from './unsaved-changes.guard';

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
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./form-builder/form-builder.component').then(
        (m) => m.FormBuilderComponent
      ),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/preview',
    loadComponent: () =>
      import('./form-preview/form-preview.component').then(
        (m) => m.FormPreviewComponent
      ),
  },
];
