import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule, InputTextModule],
  template: `
    <p-card>
      <ng-template #title>Sign in to your account</ng-template>
      <div class="flex flex-column gap-4">
        <div class="flex flex-column gap-2">
          <label for="email">Email</label>
          <input pInputText id="email" type="email" placeholder="you@example.com" />
        </div>
        <div class="flex flex-column gap-2">
          <label for="password">Password</label>
          <input pInputText id="password" type="password" placeholder="••••••••" />
        </div>
        <div class="flex justify-content-end">
          <a routerLink="/auth/forgot-password" class="text-sm">Forgot password?</a>
        </div>
        <p-button label="Sign in" styleClass="w-full" />
        <p class="text-center text-sm text-color-secondary mb-0">
          No account? <a routerLink="/auth/register">Create one</a>
        </p>
      </div>
    </p-card>
  `,
})
export class LoginComponent {}
