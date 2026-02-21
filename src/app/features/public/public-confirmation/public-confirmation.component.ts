import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-public-confirmation',
  standalone: true,
  imports: [CardModule],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--surface-ground)">
      <p-card styleClass="w-full text-center" [style]="{ 'max-width': '480px' }">
        <div class="flex flex-column align-items-center gap-3 p-4">
          <i class="pi pi-check-circle text-green-500" style="font-size: 4rem"></i>
          <h2 class="m-0">Thank You!</h2>
          <p class="m-0 text-color-secondary">Your form has been submitted successfully.</p>
        </div>
      </p-card>
    </div>
  `,
})
export class PublicConfirmationComponent {}
