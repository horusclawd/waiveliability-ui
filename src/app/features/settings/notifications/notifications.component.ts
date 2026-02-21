import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TenantService } from '../../../core/tenant/tenant.service';
import { PlanGateDirective } from '../../../core/directives/plan-gate.directive';

@Component({
  selector: 'app-settings-notifications',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ToggleSwitchModule,
    ToastModule,
    PlanGateDirective,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="router-fade">
      <h2 class="mt-0">Notifications</h2>

      <p-card styleClass="mb-4">
        <ng-template #title>
          <span class="text-lg font-semibold">Email Alerts</span>
        </ng-template>

        <ng-container *appPlanGate="'basic'">
          <form [formGroup]="notificationForm" class="flex flex-column gap-5">

            <!-- Enable Notifications Toggle -->
            <div class="flex align-items-start gap-3">
              <p-toggleswitch formControlName="notificationsEnabled" />
              <div class="flex flex-column">
                <span class="font-medium">Receive submission alerts</span>
                <small class="text-color-secondary">
                  Get email notifications when someone submits a waiver through your forms.
                </small>
              </div>
            </div>

            <!-- Notification Email -->
            <div class="flex flex-column gap-2">
              <label class="font-medium" for="notificationEmail">
                Notification Email Address
              </label>
              <input
                pInputText
                id="notificationEmail"
                type="email"
                formControlName="notificationEmail"
                placeholder="you@example.com"
                class="w-full md:w-30rem"
              />
              <small class="text-color-secondary">
                We'll send submission alerts to this email address.
              </small>
              @if (notificationForm.get('notificationEmail')?.hasError('email') && notificationForm.get('notificationEmail')?.touched) {
                <small class="p-error">Please enter a valid email address.</small>
              }
            </div>

            <div class="flex justify-content-end pt-2">
              <p-button
                type="button"
                label="Save Settings"
                icon="pi pi-check"
                [loading]="saving()"
                [disabled]="notificationForm.invalid || notificationForm.pristine"
                (onClick)="saveSettings()"
              />
            </div>

          </form>
        </ng-container>

      </p-card>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);
  private messageService = inject(MessageService);

  saving = signal(false);

  notificationForm = this.fb.nonNullable.group({
    notificationsEnabled: [false],
    notificationEmail: ['' as string, [Validators.email]],
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    const tenant = this.tenantService.tenant();

    if (tenant && tenant.notificationsEnabled !== undefined) {
      this.patchFromTenant(tenant);
    } else {
      // If tenant doesn't have notification settings yet, fetch them
      this.tenantService.getNotificationSettings().subscribe({
        next: (settings) => {
          this.notificationForm.patchValue({
            notificationsEnabled: settings.notificationsEnabled,
            notificationEmail: settings.notificationEmail ?? '',
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load notification settings.',
          });
        },
      });
    }
  }

  private patchFromTenant(tenant: {
    notificationsEnabled: boolean;
    notificationEmail: string | null;
  }): void {
    this.notificationForm.patchValue({
      notificationsEnabled: tenant.notificationsEnabled,
      notificationEmail: tenant.notificationEmail ?? '',
    });
  }

  saveSettings(): void {
    if (this.notificationForm.invalid) {
      return;
    }

    this.saving.set(true);
    const { notificationsEnabled, notificationEmail } = this.notificationForm.getRawValue();

    this.tenantService
      .updateNotificationSettings({
        notificationsEnabled,
        notificationEmail: notificationEmail || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notificationForm.markAsPristine();
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Notification settings updated successfully.',
          });
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save notification settings. Please try again.',
          });
        },
      });
  }
}
