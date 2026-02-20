import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
  ],
  template: `
    <p-card>
      <ng-template #title>Sign in to your account</ng-template>

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-column gap-4">

        @if (errorMessage()) {
          <p-message severity="error" [text]="errorMessage()!" />
        }

        <div class="flex flex-column gap-2">
          <label for="email">Email</label>
          <input
            pInputText
            id="email"
            type="email"
            formControlName="email"
            placeholder="you@example.com"
            [class.ng-invalid]="isInvalid('email')"
            [class.ng-dirty]="isInvalid('email')"
          />
          @if (isInvalid('email')) {
            <small class="p-error">
              {{ emailError() }}
            </small>
          }
        </div>

        <div class="flex flex-column gap-2">
          <div class="flex justify-content-between align-items-center">
            <label for="password">Password</label>
            <a routerLink="/auth/forgot-password" class="text-sm">Forgot password?</a>
          </div>
          <input
            pInputText
            id="password"
            type="password"
            formControlName="password"
            placeholder="••••••••"
            [class.ng-invalid]="isInvalid('password')"
            [class.ng-dirty]="isInvalid('password')"
          />
          @if (isInvalid('password')) {
            <small class="p-error">Password is required.</small>
          }
        </div>

        <p-button
          type="submit"
          label="Sign in"
          styleClass="w-full"
          [loading]="loading()"
          [disabled]="form.invalid"
        />

        <p class="text-center text-sm text-color-secondary mb-0">
          No account? <a routerLink="/auth/register">Create one</a>
        </p>

      </form>
    </p-card>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  isInvalid(field: 'email' | 'password') {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }

  emailError() {
    const ctrl = this.form.get('email')!;
    if (ctrl.hasError('required')) return 'Email is required.';
    if (ctrl.hasError('email')) return 'Please enter a valid email address.';
    return '';
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.error?.title ?? 'Invalid email or password. Please try again.'
        );
      },
    });
  }
}
