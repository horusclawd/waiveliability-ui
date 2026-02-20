import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TenantService } from '../../../core/tenant/tenant.service';

@Component({
  selector: 'app-settings-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="router-fade">
      <h2 class="mt-0">Business Profile</h2>

      <p-card>
        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-column gap-4">

          <div class="flex flex-column gap-2">
            <label for="name" class="font-medium">Business Name <span class="p-error">*</span></label>
            <input
              pInputText
              id="name"
              type="text"
              formControlName="name"
              placeholder="Your business name"
              [class.ng-invalid]="isInvalid('name')"
              [class.ng-dirty]="isInvalid('name')"
            />
            @if (isInvalid('name')) {
              <small class="p-error">Business name is required.</small>
            }
          </div>

          <div class="flex flex-column gap-2">
            <label for="address" class="font-medium">Address</label>
            <textarea
              pTextarea
              id="address"
              formControlName="address"
              placeholder="123 Main St, City, State 12345"
              rows="3"
              class="w-full"
            ></textarea>
          </div>

          <div class="flex flex-column gap-2">
            <label for="phone" class="font-medium">Phone</label>
            <input
              pInputText
              id="phone"
              type="tel"
              formControlName="phone"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div class="flex flex-column gap-2">
            <label for="websiteUrl" class="font-medium">Website URL</label>
            <input
              pInputText
              id="websiteUrl"
              type="url"
              formControlName="websiteUrl"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div class="flex justify-content-end pt-2">
            <p-button
              type="submit"
              label="Save Changes"
              icon="pi pi-check"
              [loading]="saving()"
              [disabled]="form.invalid"
            />
          </div>

        </form>
      </p-card>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);
  private messageService = inject(MessageService);

  saving = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: [''],
    phone: [''],
    websiteUrl: [''],
  });

  ngOnInit(): void {
    const tenant = this.tenantService.tenant();
    if (!tenant) {
      this.tenantService.load().subscribe({
        next: (t) => this.patchForm(t),
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load business profile.',
          });
        },
      });
    } else {
      this.patchForm(tenant);
    }
  }

  private patchForm(tenant: { name: string; address: string | null; phone: string | null; websiteUrl: string | null }) {
    this.form.patchValue({
      name: tenant.name ?? '',
      address: tenant.address ?? '',
      phone: tenant.phone ?? '',
      websiteUrl: tenant.websiteUrl ?? '',
    });
  }

  isInvalid(field: 'name'): boolean {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { name, address, phone, websiteUrl } = this.form.getRawValue();

    this.tenantService
      .update({
        name,
        address: address || undefined,
        phone: phone || undefined,
        websiteUrl: websiteUrl || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Business profile updated successfully.',
          });
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save business profile. Please try again.',
          });
        },
      });
  }
}
