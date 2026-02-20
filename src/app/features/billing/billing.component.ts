import { Component } from '@angular/core';

@Component({
  selector: 'app-billing',
  standalone: true,
  template: `
    <div class="router-fade">
      <h2 class="mt-0">Billing</h2>
      <p class="text-color-secondary">Stripe subscription management coming in Sprint 8.</p>
    </div>
  `,
})
export class BillingComponent {}
