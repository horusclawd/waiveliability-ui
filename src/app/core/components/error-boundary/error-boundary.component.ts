import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, CardModule],
  template: `
    <div class="error-boundary-container min-h-screen flex align-items-center justify-content-center p-4">
      <p-card styleClass="error-card shadow-4">
        <div class="flex flex-column align-items-center text-center gap-3 p-4">
          <div class="error-icon-container bg-red-100 border-circle">
            <i class="pi pi-exclamation-triangle text-red-500" style="font-size: 3rem"></i>
          </div>

          <h2 class="text-2xl font-bold m-0">Something went wrong</h2>

          <p class="text-color-secondary m-0 max-w-30rem">
            @if (error) {
              {{ error }}
            } @else {
              An unexpected error occurred. Please try again later.
            }
          </p>

          <div class="flex gap-2 mt-3">
            <p-button
              label="Go to Dashboard"
              icon="pi pi-home"
              routerLink="/admin/dashboard"
            />
            <p-button
              label="Try Again"
              icon="pi pi-refresh"
              severity="secondary"
              [outlined]="true"
              (onClick)="retry()"
            />
          </div>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .error-boundary-container {
      background: var(--surface-ground);
    }

    .error-icon-container {
      width: 5rem;
      height: 5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    :host ::ng-deep .error-card .p-card-body {
      padding: 2rem;
    }

    :host ::ng-deep .error-card .p-card-content {
      padding: 0;
    }
  `],
})
export class ErrorBoundaryComponent {
  @Input() error: string | null = null;
  @Input() hasError = false;

  retry(): void {
    // Reload the current route
    window.location.reload();
  }
}
