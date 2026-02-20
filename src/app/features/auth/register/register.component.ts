import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule, InputTextModule],
  template: `
    <p-card>
      <ng-template #title>Create your account</ng-template>
      <div class="flex flex-column gap-4">
        <div class="flex flex-column gap-2">
          <label for="name">Your name</label>
          <input pInputText id="name" placeholder="Jane Smith" />
        </div>
        <div class="flex flex-column gap-2">
          <label for="business">Business name</label>
          <input pInputText id="business" placeholder="Acme Inc." />
        </div>
        <div class="flex flex-column gap-2">
          <label for="email">Email</label>
          <input pInputText id="email" type="email" placeholder="you@example.com" />
        </div>
        <div class="flex flex-column gap-2">
          <label for="password">Password</label>
          <input pInputText id="password" type="password" placeholder="••••••••" />
        </div>
        <p-button label="Create account" styleClass="w-full" />
        <p class="text-center text-sm text-color-secondary mb-0">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    </p-card>
  `,
})
export class RegisterComponent {}
