import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule, InputTextModule],
  template: `
    <p-card>
      <ng-template #title>Reset your password</ng-template>
      <div class="flex flex-column gap-4">
        <p class="text-color-secondary mt-0">
          Enter your email and we'll send you a reset link.
        </p>
        <div class="flex flex-column gap-2">
          <label for="email">Email</label>
          <input pInputText id="email" type="email" placeholder="you@example.com" />
        </div>
        <p-button label="Send reset link" styleClass="w-full" />
        <p class="text-center text-sm text-color-secondary mb-0">
          <a routerLink="/auth/login">Back to sign in</a>
        </p>
      </div>
    </p-card>
  `,
})
export class ForgotPasswordComponent {}
