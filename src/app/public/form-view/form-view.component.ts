import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-view',
  standalone: true,
  template: `
    <div class="public-form-shell">
      <div class="public-form-container">
        <div class="public-form-card">
          <h2>Public Form</h2>
          <p class="text-color-secondary">
            Tenant: {{ tenantSlug() }} · Form: {{ formId() }}
          </p>
          <p>Public form renderer coming in Sprint 5.</p>
        </div>
      </div>
    </div>
  `,
})
export class FormViewComponent {
  readonly tenantSlug = input<string>('');
  readonly formId = input<string>('');
}
