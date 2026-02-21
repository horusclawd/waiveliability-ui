import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface DetectedField {
  label: string;
  fieldType: string;
  placeholder: string | null;
  required: boolean;
  fieldOrder: number;
  content: string | null;
}

interface ImportPreviewResponse {
  filename: string;
  extractedText: string;
  fields: DetectedField[];
}

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    TableModule,
    InputTextModule,
    SelectModule,
    FileUploadModule,
  ],
  template: `
    <p-dialog
      header="Import Document"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '700px' }"
      [closable]="true"
      (onHide)="onCancel()"
    >
      @if (!preview()) {
        <div class="flex flex-column gap-4">
          <p class="m-0">Upload a document (.txt, .docx, .pdf) to convert it into form fields.</p>
          <p class="text-sm text-color-secondary">We'll detect fields like questions, checkboxes, and signature lines.</p>

          <div class="flex flex-column gap-2">
            <label class="font-medium">Select File</label>
            <input
              type="file"
              accept=".txt,.docx,.pdf"
              (change)="onFileSelected($event)"
              style="width: 100%"
            />
          </div>

          @if (selectedFile()) {
            <div class="flex align-items-center gap-2">
              <i class="pi pi-file"></i>
              <span>{{ selectedFile()!.name }}</span>
              <span class="text-color-secondary">({{ (selectedFile()!.size / 1024).toFixed(1) }} KB)</span>
            </div>
          }

          @if (error()) {
            <p class="text-red-500">{{ error() }}</p>
          }

          <div class="flex justify-content-end gap-2">
            <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="onCancel()" />
            <p-button
              label="Analyze Document"
              icon="pi pi-search"
              [loading]="loading()"
              [disabled]="!selectedFile()"
              (onClick)="analyze()"
            />
          </div>
        </div>
      }

      @if (preview()) {
        <div class="flex flex-column gap-4">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-file"></i>
            <span class="font-medium">{{ preview()!.filename }}</span>
          </div>

          <p class="text-sm text-color-secondary">Review and edit the detected fields before creating your form.</p>

          <p-table [value]="preview()!.fields" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 40%">Label</th>
                <th style="width: 25%">Type</th>
                <th style="width: 20%">Required</th>
                <th style="width: 15%"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-field let-i="rowIndex">
              <tr>
                <td>
                  <input
                    pInputText
                    [(ngModel)]="field.label"
                    style="width: 100%"
                  />
                </td>
                <td>
                  <p-select
                    [(ngModel)]="field.fieldType"
                    [options]="fieldTypes"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="w-full"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    [(ngModel)]="field.required"
                  />
                </td>
                <td>
                  <p-button
                    icon="pi pi-trash"
                    [text]="true"
                    severity="danger"
                    size="small"
                    (onClick)="removeField(i)"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>

          <div class="flex justify-content-between">
            <p-button
              label="Start Over"
              icon="pi pi-refresh"
              [text]="true"
              severity="secondary"
              (onClick)="reset()"
            />
            <div class="flex gap-2">
              <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="onCancel()" />
              <p-button
                label="Create Form"
                icon="pi pi-check"
                [disabled]="preview()!.fields.length === 0"
                (onClick)="createForm()"
              />
            </div>
          </div>
        </div>
      }
    </p-dialog>
  `,
})
export class ImportDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() formCreated = new EventEmitter<void>();

  private http = inject(HttpClient);

  selectedFile = signal<File | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  preview = signal<ImportPreviewResponse | null>(null);

  fieldTypes = [
    { label: 'Text', value: 'text' },
    { label: 'Email', value: 'email' },
    { label: 'Checkbox', value: 'checkbox' },
    { label: 'Content', value: 'content' },
    { label: 'Textarea', value: 'textarea' },
  ];

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile.set(input.files[0]);
      this.error.set(null);
    }
  }

  analyze() {
    const file = this.selectedFile();
    if (!file) return;

    this.loading.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('file', file);

    this.http
      .post<ImportPreviewResponse>(`${environment.apiBaseUrl}/admin/forms/import`, formData)
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.preview.set(response);
        },
        error: (err) => {
          this.loading.set(false);
          if (err.status === 402) {
            this.error.set('Document import requires a Basic or Premium plan. Please upgrade to use this feature.');
          } else {
            this.error.set(err.error?.title || 'Failed to analyze document');
          }
        },
      });
  }

  removeField(index: number) {
    const p = this.preview();
    if (p) {
      p.fields.splice(index, 1);
      // Re-order
      p.fields.forEach((f, i) => (f.fieldOrder = i));
      this.preview.set({ ...p });
    }
  }

  reset() {
    this.selectedFile.set(null);
    this.preview.set(null);
    this.error.set(null);
  }

  onCancel() {
    this.reset();
    this.visibleChange.emit(false);
  }

  createForm() {
    const p = this.preview();
    if (!p) return;

    // Convert to form request and create
    const formRequest = {
      name: p.filename.replace(/\.[^/.]+$/, ''),
      description: 'Imported from ' + p.filename,
      fields: p.fields.map((f) => ({
        fieldType: f.fieldType,
        label: f.label,
        placeholder: f.placeholder,
        required: f.required,
        fieldOrder: f.fieldOrder,
        options: null,
        content: f.content,
      })),
    };

    this.http
      .post<{ id: string }>(`${environment.apiBaseUrl}/admin/forms`, formRequest)
      .subscribe({
        next: () => {
          this.formCreated.emit();
          this.onCancel();
        },
        error: (err) => {
          this.error.set(err.error?.title || 'Failed to create form');
        },
      });
  }
}
