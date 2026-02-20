import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-shell">
      <div class="auth-card-wrapper">
        <div class="auth-brand">
          <i class="pi pi-shield"></i>
          <span>WaiveLiability</span>
        </div>
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--p-surface-ground);
      padding: 1rem;
    }

    .auth-card-wrapper {
      width: 100%;
      max-width: 420px;
    }

    .auth-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--p-text-color);
      margin-bottom: 2rem;

      i {
        font-size: 1.5rem;
        color: var(--p-primary-color);
      }
    }
  `],
})
export class AuthLayoutComponent {}
