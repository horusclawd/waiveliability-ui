import { CanDeactivateFn } from '@angular/router';
import { FormBuilderComponent } from './form-builder/form-builder.component';

export const unsavedChangesGuard: CanDeactivateFn<FormBuilderComponent> = (component) => {
  if (component.isDirty()) {
    return confirm('You have unsaved changes. Leave anyway?');
  }
  return true;
};
