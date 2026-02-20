import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CardModule, ButtonModule, InputTextModule],
  template: `
    <p-card>
      <ng-template #title>Set new password</ng-template>
      <div class="flex flex-column gap-4">
        <div class="flex flex-column gap-2">
          <label for="password">New password</label>
          <input pInputText id="password" type="password" placeholder="••••••••" />
        </div>
        <div class="flex flex-column gap-2">
          <label for="confirm">Confirm password</label>
          <input pInputText id="confirm" type="password" placeholder="••••••••" />
        </div>
        <p-button label="Set password" styleClass="w-full" />
      </div>
    </p-card>
  `,
})
export class ResetPasswordComponent {}
