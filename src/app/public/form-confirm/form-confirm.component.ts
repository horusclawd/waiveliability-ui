import { Component } from '@angular/core';

@Component({
  selector: 'app-form-confirm',
  standalone: true,
  template: `
    <div class="public-form-shell">
      <div class="public-form-container">
        <div class="public-form-card text-center">
          <i class="pi pi-check-circle text-green-500" style="font-size: 3rem"></i>
          <h2>Thank you!</h2>
          <p class="text-color-secondary">Your submission has been received.</p>
        </div>
      </div>
    </div>
  `,
})
export class FormConfirmComponent {}
