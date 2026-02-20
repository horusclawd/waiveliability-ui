import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register',
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
      <ng-template #title>Create your account</ng-template>

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-column gap-4">

        @if (errorMessage()) {
          <p-message severity="error" [text]="errorMessage()!" />
        }

        <div class="flex flex-column gap-2">
          <label for="name">Your name</label>
          <input
            pInputText
            id="name"
            formControlName="name"
            placeholder="Jane Smith"
            [class.ng-invalid]="isInvalid('name')"
            [class.ng-dirty]="isInvalid('name')"
          />
          @if (isInvalid('name')) {
            <small class="p-error">Your name is required.</small>
          }
        </div>

        <div class="flex flex-column gap-2">
          <label for="businessName">Business name</label>
          <input
            pInputText
            id="businessName"
            formControlName="businessName"
            placeholder="Acme Inc."
            [class.ng-invalid]="isInvalid('businessName')"
            [class.ng-dirty]="isInvalid('businessName')"
          />
          @if (isInvalid('businessName')) {
            <small class="p-error">Business name is required.</small>
          }
        </div>

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
            <small class="p-error">{{ emailError() }}</small>
          }
        </div>

        <div class="flex flex-column gap-2">
          <label for="password">Password</label>
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
            <small class="p-error">{{ passwordError() }}</small>
          }
        </div>

        <div class="flex flex-column gap-2">
          <label for="confirmPassword">Confirm password</label>
          <input
            pInputText
            id="confirmPassword"
            type="password"
            formControlName="confirmPassword"
            placeholder="••••••••"
            [class.ng-invalid]="confirmInvalid()"
            [class.ng-dirty]="confirmInvalid()"
          />
          @if (confirmInvalid()) {
            <small class="p-error">Passwords do not match.</small>
          }
        </div>

        <p-button
          type="submit"
          label="Create account"
          styleClass="w-full"
          [loading]="loading()"
          [disabled]="form.invalid"
        />

        <p class="text-center text-sm text-color-secondary mb-0">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
        </p>

      </form>
    </p-card>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      businessName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );

  isInvalid(field: keyof typeof this.form.controls) {
    const ctrl = this.form.get(field as string)!;
    return ctrl.invalid && ctrl.touched;
  }

  confirmInvalid() {
    const ctrl = this.form.get('confirmPassword')!;
    return (
      ctrl.touched &&
      (ctrl.invalid || this.form.hasError('passwordsMismatch'))
    );
  }

  emailError() {
    const ctrl = this.form.get('email')!;
    if (ctrl.hasError('required')) return 'Email is required.';
    if (ctrl.hasError('email')) return 'Please enter a valid email address.';
    return '';
  }

  passwordError() {
    const ctrl = this.form.get('password')!;
    if (ctrl.hasError('required')) return 'Password is required.';
    if (ctrl.hasError('minlength')) return 'Password must be at least 8 characters.';
    return '';
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { name, email, password, businessName } = this.form.getRawValue();
    this.auth.register(name, email, password, businessName).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.error?.title ?? 'Registration failed. Please try again.'
        );
      },
    });
  }
}
