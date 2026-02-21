import { Component, OnInit, signal, inject, computed, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { environment } from '../../../../environments/environment';
import { Form, FormField } from '../../forms/form.model';
import { SignaturePadComponent } from './signature-pad/signature-pad.component';

interface PublicBranding {
  tenantName: string;
  primaryColor: string | null;
  bgColor: string | null;
  fontFamily: string | null;
  logoUrl: string | null;
  hidePoweredBy: boolean;
}

@Component({
  selector: 'app-public-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    SelectModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    CardModule,
    DividerModule,
    SignaturePadComponent,
  ],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 2rem 1rem; background: var(--surface-ground)">
      <div style="width: 100%; max-width: 640px">

        <!-- Loading state -->
        @if (loading()) {
          <div class="flex justify-content-center align-items-center" style="min-height: 60vh">
            <p-progressSpinner strokeWidth="4" style="width: 48px; height: 48px" />
          </div>
        }

        <!-- Error state -->
        @if (!loading() && loadError()) {
          <p-card>
            <div class="flex flex-column align-items-center gap-3 p-4 text-center">
              <i class="pi pi-exclamation-circle text-orange-500" style="font-size: 3rem"></i>
              <h2 class="m-0">{{ loadError() }}</h2>
            </div>
          </p-card>
        }

        <!-- Form -->
        @if (!loading() && !loadError() && form()) {
          <!-- Tenant header -->
          <div class="text-center mb-4">
            @if (branding()?.logoUrl) {
              <img [src]="branding()!.logoUrl" alt="Logo" style="max-height: 60px; margin-bottom: 0.75rem" />
            }
            <div class="text-color-secondary text-sm">{{ branding()?.tenantName || tenantSlug() }}</div>
          </div>

          <p-card>
            <!-- Form title & description -->
            <div class="mb-4">
              <h2 class="mt-0 mb-2">{{ form()!.name }}</h2>
              @if (form()!.description) {
                <p class="m-0 text-color-secondary">{{ form()!.description }}</p>
              }
            </div>

            <p-divider />

            <!-- Fields -->
            <div class="flex flex-column gap-4">
              <ng-container *ngFor="let field of sortedFields()">
                <div class="flex flex-column gap-1">
                  <label [for]="field.id" class="font-medium text-sm">
                    {{ field.label }}
                    @if (field.required) {
                      <span class="text-red-500 ml-1">*</span>
                    }
                  </label>

                  <!-- Signature field -->
                  @if (isSignatureField(field)) {
                    <app-signature-pad
                      (signatureChange)="onSignatureChange(field.id, $event)"
                    />
                  }

                  <!-- Text field -->
                  @else if (field.fieldType === 'text') {
                    <input
                      [id]="field.id"
                      pInputText
                      [ngModel]="answers()[field.id] ?? ''"
                      (ngModelChange)="setAnswer(field.id, $event)"
                      [placeholder]="field.placeholder || ''"
                      style="width: 100%"
                    />
                  }

                  <!-- Email field -->
                  @else if (field.fieldType === 'email') {
                    <input
                      [id]="field.id"
                      pInputText
                      type="email"
                      [ngModel]="answers()[field.id] ?? ''"
                      (ngModelChange)="setAnswer(field.id, $event)"
                      [placeholder]="field.placeholder || ''"
                      style="width: 100%"
                    />
                  }

                  <!-- Textarea field -->
                  @else if (field.fieldType === 'textarea') {
                    <textarea
                      [id]="field.id"
                      pTextarea
                      rows="4"
                      [ngModel]="answers()[field.id] ?? ''"
                      (ngModelChange)="setAnswer(field.id, $event)"
                      [placeholder]="field.placeholder || ''"
                      style="width: 100%; resize: vertical"
                    ></textarea>
                  }

                  <!-- Checkbox field -->
                  @else if (field.fieldType === 'checkbox') {
                    <div class="flex align-items-center gap-2 mt-1">
                      <p-checkbox
                        [inputId]="field.id"
                        [binary]="true"
                        [ngModel]="answers()[field.id] ?? false"
                        (ngModelChange)="setAnswer(field.id, $event)"
                      />
                      <label [for]="field.id" class="cursor-pointer text-sm">{{ field.label }}</label>
                    </div>
                  }

                  <!-- Select field -->
                  @else if (field.fieldType === 'select') {
                    <p-select
                      [inputId]="field.id"
                      [options]="field.options || []"
                      optionLabel="label"
                      optionValue="value"
                      [ngModel]="answers()[field.id] ?? null"
                      (ngModelChange)="setAnswer(field.id, $event)"
                      [placeholder]="field.placeholder || 'Select an option'"
                      styleClass="w-full"
                    />
                  }

                  <!-- Content field (read-only legal text with rich formatting) -->
                  @else if (field.fieldType === 'content') {
                    <div class="content-field p-3 surface-50 border-round" style="font-size: 0.95rem; line-height: 1.6" [innerHTML]="field.content || ''">
                    </div>
                  }

                  <!-- Validation error -->
                  @if (errors()[field.id]) {
                    <small class="text-red-500">{{ errors()[field.id] }}</small>
                  }
                </div>
              </ng-container>
            </div>

            <p-divider />

            <!-- Submit error -->
            @if (submitError()) {
              <p-message severity="error" [text]="submitError()!" styleClass="w-full mb-3" />
            }

            <!-- Submit button -->
            <div class="flex justify-content-end">
              <p-button
                label="Submit"
                icon="pi pi-send"
                [loading]="submitting()"
                (onClick)="onSubmit()"
              />
            </div>

            @if (!branding()?.hidePoweredBy) {
              <div class="text-center mt-4">
                <small class="text-color-secondary">Powered by WaiveLiability</small>
              </div>
            }
          </p-card>
        }

      </div>
    </div>
  `,
})
export class PublicFormComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  http = inject(HttpClient);

  tenantSlug = signal('');
  formId = signal('');
  form = signal<Form | null>(null);
  branding = signal<PublicBranding | null>(null);
  answers = signal<Record<string, unknown>>({});
  signatureData = signal<string | null>(null);
  loading = signal(true);
  submitting = signal(false);
  errors = signal<Record<string, string>>({});
  loadError = signal<string | null>(null);
  submitError = signal<string | null>(null);

  sortedFields = computed(() => {
    const f = this.form();
    if (!f) return [];
    return [...f.fields].sort((a, b) => a.fieldOrder - b.fieldOrder);
  });

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('tenantSlug') ?? '';
    const fId = this.route.snapshot.paramMap.get('formId') ?? '';
    this.tenantSlug.set(slug);
    this.formId.set(fId);
    this.loadForm(slug, fId);
    this.loadBranding(slug);
  }

  private loadForm(slug: string, formId: string) {
    this.http
      .get<Form>(`${environment.apiBaseUrl}/public/${slug}/forms/${formId}`)
      .subscribe({
        next: (form) => {
          this.form.set(form);
          this.loading.set(false);
        },
        error: (err) => {
          if (err?.status === 404) {
            this.loadError.set('Form not found');
          } else if (err?.status === 403) {
            this.loadError.set('This form is not currently accepting submissions');
          } else {
            this.loadError.set('Unable to load form. Please try again later.');
          }
          this.loading.set(false);
        },
      });
  }

  private loadBranding(slug: string) {
    this.http
      .get<PublicBranding>(`${environment.apiBaseUrl}/public/${slug}/branding`)
      .subscribe({
        next: (b) => this.branding.set(b),
        error: () => { /* branding is optional, ignore errors */ },
      });
  }

  isSignatureField(field: FormField): boolean {
    return field.label.toLowerCase().includes('signature');
  }

  setAnswer(fieldId: string, value: unknown) {
    this.answers.update(a => ({ ...a, [fieldId]: value }));
  }

  onSignatureChange(fieldId: string, signatureDataUrl: string) {
    if (signatureDataUrl) {
      // Store the signature data URL as the field value
      this.setAnswer(fieldId, signatureDataUrl);
      // Also store separately for API submission
      this.signatureData.set(signatureDataUrl);
    }
  }

  onSubmit() {
    if (!this.validate()) return;

    this.submitting.set(true);
    this.submitError.set(null);

    const answers = this.answers();
    this.http
      .post<{ id: string }>(
        `${environment.apiBaseUrl}/public/${this.tenantSlug()}/forms/${this.formId()}/submit`,
        { answers, signatureData: this.signatureData() }
      )
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.router.navigate(['/public', this.tenantSlug(), 'forms', this.formId(), 'confirmation'], {
            queryParams: { submissionId: response.id },
          });
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(
            err?.error?.title ?? 'Submission failed. Please try again.'
          );
        },
      });
  }

  private validate(): boolean {
    const newErrors: Record<string, string> = {};
    const answers = this.answers();

    for (const field of this.sortedFields()) {
      // Content fields are display-only, skip validation
      if (field.fieldType === 'content') continue;
      if (!field.required) continue;

      const val = answers[field.id];

      // Signature fields require a non-empty value (data URL)
      if (this.isSignatureField(field)) {
        if (!val || String(val).trim() === '') {
          newErrors[field.id] = 'Signature is required';
        }
      } else if (field.fieldType === 'checkbox') {
        if (!val) newErrors[field.id] = 'This field is required';
      } else {
        if (!val || String(val).trim() === '') {
          newErrors[field.id] = 'This field is required';
        }
      }
    }

    this.errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  }
}
