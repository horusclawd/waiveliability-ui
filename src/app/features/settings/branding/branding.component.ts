import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule, ColorPickerChangeEvent } from 'primeng/colorpicker';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FileUploadModule, FileUploadHandlerEvent } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TenantService } from '../../../core/tenant/tenant.service';
import { PlanGateDirective } from '../../../core/directives/plan-gate.directive';

interface FontOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-settings-branding',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ColorPickerModule,
    SelectModule,
    ToggleSwitchModule,
    FileUploadModule,
    ToastModule,
    PlanGateDirective,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="router-fade">
      <h2 class="mt-0">Branding</h2>

      <!-- Logo Section (available on free plan) -->
      <p-card styleClass="mb-4">
        <ng-template #title>
          <span class="text-lg font-semibold">Logo</span>
        </ng-template>

        <div class="flex flex-column gap-4">

          @if (logoUrl()) {
            <div class="flex flex-column gap-3">
              <p class="text-color-secondary m-0">Current logo:</p>
              <div class="flex align-items-center gap-4">
                <img
                  [src]="logoUrl()!"
                  alt="Business logo"
                  style="max-height: 80px; max-width: 200px; object-fit: contain; border: 1px solid var(--p-surface-200); border-radius: 6px; padding: 8px;"
                />
                <p-button
                  label="Remove Logo"
                  icon="pi pi-trash"
                  severity="danger"
                  [outlined]="true"
                  size="small"
                  [loading]="deletingLogo()"
                  (onClick)="deleteLogo()"
                />
              </div>
            </div>
          }

          <div class="flex flex-column gap-2">
            <label class="font-medium">Upload Logo</label>
            <p class="text-color-secondary text-sm m-0">
              Accepted formats: PNG, JPG, WebP. Max size: 5 MB.
            </p>
            <p-fileupload
              mode="basic"
              accept=".jpg,.jpeg,.png,.webp"
              [maxFileSize]="5000000"
              chooseLabel="Choose Logo"
              chooseIcon="pi pi-upload"
              [auto]="true"
              [customUpload]="true"
              (uploadHandler)="onLogoUpload($event)"
              [disabled]="uploadingLogo()"
            />
            @if (uploadingLogo()) {
              <small class="text-color-secondary">Uploading logo...</small>
            }
          </div>

        </div>
      </p-card>

      <!-- Colors, Font & Options (plan-gated to basic) -->
      <ng-container *appPlanGate="'basic'">
        <p-card styleClass="mb-4">
          <ng-template #title>
            <span class="text-lg font-semibold">Colors &amp; Typography</span>
          </ng-template>

          <form [formGroup]="brandingForm" class="flex flex-column gap-5">

            <!-- Primary Color -->
            <div class="flex flex-column gap-2">
              <label class="font-medium">Primary Color</label>
              <div class="flex align-items-center gap-3">
                <p-colorpicker
                  formControlName="primaryColor"
                  format="hex"
                  (onChange)="onPrimaryColorPickerChange($event)"
                />
                <input
                  pInputText
                  type="text"
                  [value]="primaryColorHex()"
                  (input)="onPrimaryColorHexInput($event)"
                  placeholder="#000000"
                  style="width: 120px;"
                  maxlength="7"
                />
              </div>
            </div>

            <!-- Background Color -->
            <div class="flex flex-column gap-2">
              <label class="font-medium">Background Color</label>
              <div class="flex align-items-center gap-3">
                <p-colorpicker
                  formControlName="bgColor"
                  format="hex"
                  (onChange)="onBgColorPickerChange($event)"
                />
                <input
                  pInputText
                  type="text"
                  [value]="bgColorHex()"
                  (input)="onBgColorHexInput($event)"
                  placeholder="#ffffff"
                  style="width: 120px;"
                  maxlength="7"
                />
              </div>
            </div>

            <!-- Font Family -->
            <div class="flex flex-column gap-2">
              <label class="font-medium">Font Family</label>
              <p-select
                formControlName="fontFamily"
                [options]="fontOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select a font"
                style="width: 220px;"
              />
            </div>

            <!-- Hide Powered By -->
            <div class="flex align-items-center gap-3">
              <p-toggleswitch formControlName="hidePoweredBy" />
              <div class="flex flex-column">
                <span class="font-medium">Hide "Powered by WaveLiability"</span>
                <small class="text-color-secondary">Remove the WaveLiability branding from your public forms.</small>
              </div>
            </div>

            <div class="flex justify-content-end pt-2">
              <p-button
                type="button"
                label="Save Branding"
                icon="pi pi-check"
                [loading]="savingBranding()"
                (onClick)="submitBranding()"
              />
            </div>

          </form>
        </p-card>
      </ng-container>

    </div>
  `,
})
export class BrandingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);
  private messageService = inject(MessageService);

  uploadingLogo = signal(false);
  deletingLogo = signal(false);
  savingBranding = signal(false);

  logoUrl = signal<string | null>(null);
  primaryColorHex = signal<string>('#000000');
  bgColorHex = signal<string>('#ffffff');

  fontOptions: FontOption[] = [
    { label: 'Inter', value: 'Inter' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Lato', value: 'Lato' },
    { label: 'Poppins', value: 'Poppins' },
    { label: 'Merriweather', value: 'Merriweather' },
  ];

  brandingForm = this.fb.nonNullable.group({
    primaryColor: ['000000'],
    bgColor: ['ffffff'],
    fontFamily: ['' as string],
    hidePoweredBy: [false],
  });

  ngOnInit(): void {
    const tenant = this.tenantService.tenant();
    if (!tenant) {
      this.tenantService.load().subscribe({
        next: (t) => this.patchFromTenant(t),
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load branding settings.',
          });
        },
      });
    } else {
      this.patchFromTenant(tenant);
    }
  }

  private patchFromTenant(tenant: { branding: { primaryColor: string | null; bgColor: string | null; fontFamily: string | null; logoUrl: string | null; hidePoweredBy: boolean } }): void {
    const b = tenant.branding;
    this.logoUrl.set(b.logoUrl);

    const primaryHex = b.primaryColor ?? '#000000';
    const bgHex = b.bgColor ?? '#ffffff';

    this.primaryColorHex.set(primaryHex);
    this.bgColorHex.set(bgHex);

    // ColorPicker expects hex without '#'
    this.brandingForm.patchValue({
      primaryColor: primaryHex.replace('#', ''),
      bgColor: bgHex.replace('#', ''),
      fontFamily: b.fontFamily ?? '',
      hidePoweredBy: b.hidePoweredBy,
    });
  }

  // --- ColorPicker change handlers (ColorPicker emits value without '#') ---

  onPrimaryColorPickerChange(event: ColorPickerChangeEvent): void {
    if (typeof event.value === 'string') {
      this.primaryColorHex.set('#' + event.value);
    }
  }

  onBgColorPickerChange(event: ColorPickerChangeEvent): void {
    if (typeof event.value === 'string') {
      this.bgColorHex.set('#' + event.value);
    }
  }

  // --- Hex text input handlers (sync back to ColorPicker form control) ---

  onPrimaryColorHexInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.primaryColorHex.set(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      this.brandingForm.patchValue({ primaryColor: val.replace('#', '') });
    }
  }

  onBgColorHexInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.bgColorHex.set(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      this.brandingForm.patchValue({ bgColor: val.replace('#', '') });
    }
  }

  // --- Logo upload ---

  onLogoUpload(event: FileUploadHandlerEvent): void {
    const file = event.files[0];
    if (!file) return;

    this.uploadingLogo.set(true);
    this.tenantService.uploadLogo(file).subscribe({
      next: (tenant) => {
        this.uploadingLogo.set(false);
        this.logoUrl.set(tenant.branding.logoUrl);
        this.messageService.add({
          severity: 'success',
          summary: 'Logo Uploaded',
          detail: 'Your logo has been updated.',
        });
      },
      error: () => {
        this.uploadingLogo.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: 'Failed to upload logo. Please try again.',
        });
      },
    });
  }

  // --- Logo delete ---

  deleteLogo(): void {
    this.deletingLogo.set(true);
    this.tenantService.deleteLogo().subscribe({
      next: () => {
        this.deletingLogo.set(false);
        this.logoUrl.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Logo Removed',
          detail: 'Your logo has been deleted.',
        });
      },
      error: () => {
        this.deletingLogo.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove logo. Please try again.',
        });
      },
    });
  }

  // --- Save branding ---

  submitBranding(): void {
    this.savingBranding.set(true);
    const { primaryColor, bgColor, fontFamily, hidePoweredBy } = this.brandingForm.getRawValue();

    this.tenantService
      .updateBranding({
        primaryColor: '#' + primaryColor,
        bgColor: '#' + bgColor,
        fontFamily: fontFamily || undefined,
        hidePoweredBy,
      })
      .subscribe({
        next: () => {
          this.savingBranding.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Branding settings updated successfully.',
          });
        },
        error: () => {
          this.savingBranding.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save branding settings. Please try again.',
          });
        },
      });
  }
}
