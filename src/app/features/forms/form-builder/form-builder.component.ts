import {
  Component,
  OnInit,
  computed,
  signal,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { EditorModule } from 'primeng/editor';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { FormService } from '../form.service';
import { FieldType, FormField, FormFieldOption } from '../form.model';

interface PaletteItem {
  type: FieldType;
  label: string;
  icon: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'text',     label: 'Text',     icon: 'pi pi-font' },
  { type: 'email',    label: 'Email',    icon: 'pi pi-envelope' },
  { type: 'number',   label: 'Number',   icon: 'pi pi-hashtag' },
  { type: 'date',     label: 'Date',     icon: 'pi pi-calendar' },
  { type: 'textarea', label: 'Textarea', icon: 'pi pi-align-left' },
  { type: 'checkbox', label: 'Checkbox', icon: 'pi pi-check-square' },
  { type: 'select',   label: 'Select',   icon: 'pi pi-list' },
  { type: 'content',  label: 'Content',  icon: 'pi pi-file' },
];

function generateId(): string {
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    EditorModule,
    ToastModule,
    TagModule,
    ToggleSwitchModule,
    CardModule,
    ToolbarModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  styles: [`
    .builder-layout {
      display: flex;
      gap: 1rem;
      height: calc(100vh - 140px);
      min-height: 500px;
    }
    .palette-panel {
      width: 220px;
      flex-shrink: 0;
      overflow-y: auto;
    }
    .canvas-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .properties-panel {
      width: 300px;
      flex-shrink: 0;
      overflow-y: auto;
    }
    .field-drop-list {
      min-height: 80px;
      flex: 1;
      overflow-y: auto;
    }
    .field-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--p-surface-border);
      border-radius: 6px;
      background: var(--p-surface-card);
      margin-bottom: 0.5rem;
      cursor: default;
    }
    .field-row:hover {
      border-color: var(--p-primary-color);
    }
    .field-row.selected {
      border-color: var(--p-primary-color);
      background: var(--p-primary-50, #eff6ff);
    }
    .drag-handle {
      cursor: grab;
      color: var(--p-text-muted-color);
    }
    .drag-handle:active { cursor: grabbing; }
    .cdk-drag-preview { box-shadow: 0 4px 16px rgba(0,0,0,.2); }
    .cdk-drag-placeholder { opacity: 0.4; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0,0,0.2,1); }
    .palette-btn {
      width: 100%;
      justify-content: flex-start;
      margin-bottom: 0.35rem;
    }
    .option-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.4rem;
    }
  `],
  template: `
    <div class="router-fade p-4" style="overflow: hidden">
      <p-toast />

      <!-- Top toolbar -->
      <p-toolbar styleClass="mb-3">
        <ng-template #start>
          <p-button
            icon="pi pi-arrow-left"
            [text]="true"
            severity="secondary"
            (onClick)="goBack()"
            class="mr-2"
          />
          @if (isEditingName()) {
            <input
              pInputText
              [ngModel]="formNameValue()"
              (ngModelChange)="formNameValue.set($event)"
              (blur)="isEditingName.set(false)"
              (keydown.enter)="isEditingName.set(false)"
              (keydown.escape)="isEditingName.set(false)"
              style="font-size: 1.1rem; font-weight: 600; width: 280px"
              #nameInput
            />
          } @else {
            <span
              class="text-xl font-semibold cursor-pointer"
              (click)="isEditingName.set(true)"
              title="Click to edit form name"
            >{{ formNameValue() || 'Untitled Form' }}</span>
          }
        </ng-template>
        <ng-template #end>
          @if (formId()) {
            <p-button
              [label]="currentForm()?.status === 'published' ? 'Unpublish' : 'Publish'"
              [icon]="currentForm()?.status === 'published' ? 'pi pi-eye-slash' : 'pi pi-globe'"
              severity="secondary"
              class="mr-2"
              [loading]="publishing()"
              (onClick)="togglePublish()"
            />
          }
          <p-button
            label="Save"
            icon="pi pi-save"
            [loading]="saving()"
            [disabled]="!isDirty()"
            (onClick)="save()"
          />
        </ng-template>
      </p-toolbar>

      <!-- Loading state -->
      @if (loading()) {
        <div class="flex justify-content-center align-items-center" style="height: 300px">
          <p-progressSpinner strokeWidth="4" style="width: 48px; height: 48px" />
        </div>
      }

      @if (!loading()) {
        <div class="builder-layout">

          <!-- Left: Field palette -->
          <div class="palette-panel">
            <p-card header="Field Types" styleClass="h-full">
              <div class="flex flex-column">
                @for (item of paletteItems; track item.type) {
                  <p-button
                    [label]="item.label"
                    [icon]="item.icon"
                    severity="secondary"
                    [text]="true"
                    styleClass="palette-btn"
                    (onClick)="addField(item.type)"
                  />
                }
              </div>
              <div class="text-sm text-color-secondary mt-3 pt-3" style="border-top: 1px solid var(--p-surface-border)">
                Click a field type to add it, or drag fields on the canvas to reorder.
              </div>
            </p-card>
          </div>

          <!-- Center: Canvas -->
          <div class="canvas-panel">
            <p-card styleClass="h-full flex flex-column" [style]="{ display: 'flex', flexDirection: 'column', height: '100%' }">
              <ng-template #header>
                <div class="p-3 pb-0">
                  <div class="flex flex-column gap-1 mb-2">
                    <label class="font-medium text-sm">Form Description <span class="text-color-secondary">(optional)</span></label>
                    <textarea
                      pTextarea
                      [ngModel]="formDescriptionValue()"
                      (ngModelChange)="formDescriptionValue.set($event)"
                      placeholder="Add a brief description…"
                      rows="2"
                      style="resize: none; width: 100%"
                    ></textarea>
                  </div>
                </div>
              </ng-template>

              <div class="field-drop-list" cdkDropList (cdkDropListDropped)="onDrop($event)">
                @if (fields().length === 0) {
                  <div class="flex flex-column align-items-center justify-content-center text-color-secondary p-5">
                    <i class="pi pi-inbox text-4xl mb-3"></i>
                    <span>No fields yet. Add fields from the palette on the left.</span>
                  </div>
                }
                @for (field of fields(); track field.id; let i = $index) {
                  <div
                    class="field-row"
                    [class.selected]="selectedField()?.id === field.id"
                    cdkDrag
                    [cdkDragData]="field"
                    (click)="selectField(field)"
                  >
                    <i class="drag-handle pi pi-bars" cdkDragHandle></i>
                    <p-tag
                      [value]="field.fieldType"
                      severity="secondary"
                      styleClass="text-xs"
                    />
                    <span class="flex-1 font-medium">{{ field.label || '(Untitled)' }}</span>
                    @if (field.required) {
                      <span class="text-red-500 font-bold" title="Required">*</span>
                    }
                    <p-button
                      icon="pi pi-pencil"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      size="small"
                      (click)="selectField(field); $event.stopPropagation()"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [text]="true"
                      [rounded]="true"
                      severity="danger"
                      size="small"
                      (click)="removeField(field.id); $event.stopPropagation()"
                    />
                  </div>
                }
              </div>
            </p-card>
          </div>

          <!-- Right: Properties -->
          <div class="properties-panel">
            <p-card [header]="selectedField() ? 'Field Properties' : 'Form Info'" styleClass="h-full">
              @if (!selectedField()) {
                <div class="text-color-secondary text-sm">
                  <p>Select a field on the canvas to edit its properties.</p>
                  <p class="mt-3">Total fields: <strong>{{ fields().length }}</strong></p>
                  @if (formId()) {
                    <p>Status:
                      <p-tag
                        [value]="currentForm()?.status === 'published' ? 'Published' : 'Draft'"
                        [severity]="currentForm()?.status === 'published' ? 'success' : 'secondary'"
                      />
                    </p>
                  }
                </div>
              }

              @if (selectedField(); as field) {
                <div class="flex flex-column gap-3">

                  <!-- Close / deselect -->
                  <div class="flex justify-content-between align-items-center">
                    <p-tag [value]="field.fieldType" severity="secondary" />
                    <p-button
                      icon="pi pi-times"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      size="small"
                      (onClick)="selectedField.set(null)"
                    />
                  </div>

                  <!-- Label -->
                  <div class="flex flex-column gap-1">
                    <label class="font-medium text-sm">Label <span class="text-red-500">*</span></label>
                    <input
                      pInputText
                      [ngModel]="field.label"
                      (ngModelChange)="updateFieldProp(field.id, 'label', $event)"
                      placeholder="Field label"
                    />
                  </div>

                  <!-- Placeholder (not for checkbox or content) -->
                  @if (field.fieldType !== 'checkbox' && field.fieldType !== 'content') {
                    <div class="flex flex-column gap-1">
                      <label class="font-medium text-sm">Placeholder</label>
                      <input
                        pInputText
                        [ngModel]="field.placeholder"
                        (ngModelChange)="updateFieldProp(field.id, 'placeholder', $event)"
                        placeholder="Optional placeholder text"
                      />
                    </div>
                  }

                  <!-- Required toggle (not for content type) -->
                  @if (field.fieldType !== 'content') {
                    <div class="flex align-items-center gap-2">
                      <p-toggleswitch
                        [ngModel]="field.required"
                        (ngModelChange)="updateFieldProp(field.id, 'required', $event)"
                      />
                      <label class="font-medium text-sm">Required</label>
                    </div>
                  }

                  <!-- Content text (content type only) -->
                  @if (field.fieldType === 'content') {
                    <div class="flex flex-column gap-1">
                      <label class="font-medium text-sm">Content Text</label>
                      <p-editor
                        [ngModel]="field.content"
                        (ngModelChange)="updateFieldProp(field.id, 'content', $event)"
                        [style]="{ height: '200px' }"
                        placeholder="Enter legal text, terms, or other content to display..."
                      />
                      <small class="text-color-secondary">This text will be displayed to users but cannot be edited. Use bold, italics, lists, etc.</small>
                    </div>
                  }

                  <!-- Options (select type only) -->
                  @if (field.fieldType === 'select') {
                    <div class="flex flex-column gap-2">
                      <div class="flex justify-content-between align-items-center">
                        <label class="font-medium text-sm">Options</label>
                        <p-button
                          icon="pi pi-plus"
                          label="Add"
                          size="small"
                          [text]="true"
                          (onClick)="addOption(field.id)"
                        />
                      </div>
                      @for (opt of field.options || []; track $index; let oi = $index) {
                        <div class="option-row">
                          <input
                            pInputText
                            [ngModel]="opt.label"
                            (ngModelChange)="updateOption(field.id, oi, 'label', $event)"
                            placeholder="Label"
                            style="flex: 1"
                          />
                          <input
                            pInputText
                            [ngModel]="opt.value"
                            (ngModelChange)="updateOption(field.id, oi, 'value', $event)"
                            placeholder="Value"
                            style="flex: 1"
                          />
                          <p-button
                            icon="pi pi-trash"
                            [text]="true"
                            [rounded]="true"
                            severity="danger"
                            size="small"
                            (onClick)="removeOption(field.id, oi)"
                          />
                        </div>
                      }
                      @if ((field.options || []).length === 0) {
                        <p class="text-sm text-color-secondary">No options yet. Click Add to add options.</p>
                      }
                    </div>
                  }

                </div>
              }
            </p-card>
          </div>

        </div>
      }
    </div>
  `,
})
export class FormBuilderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  readonly formService = inject(FormService);

  readonly paletteItems = PALETTE_ITEMS;

  // Route state
  formId = signal<string | null>(null);

  // Local editable state
  formNameValue = signal('');
  formDescriptionValue = signal('');
  fields = signal<FormField[]>([]);
  selectedField = signal<FormField | null>(null);

  // UI state
  loading = signal(false);
  saving = signal(false);
  publishing = signal(false);
  isEditingName = signal(false);

  // Derived
  currentForm = this.formService.currentForm;

  isDirty = computed(() => {
    const remote = this.currentForm();
    if (!remote && this.formId() === null) {
      // new form: dirty if any content
      return this.formNameValue().trim().length > 0 || this.fields().length > 0;
    }
    if (!remote) return false;
    return (
      this.formNameValue() !== remote.name ||
      (this.formDescriptionValue() || null) !== remote.description ||
      JSON.stringify(this.fields()) !== JSON.stringify(remote.fields)
    );
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.formId.set(id);
      this.loading.set(true);
      this.formService.getForm(id).subscribe({
        next: (form) => {
          this.formNameValue.set(form.name);
          this.formDescriptionValue.set(form.description ?? '');
          this.fields.set(form.fields.slice().sort((a, b) => a.fieldOrder - b.fieldOrder));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load form.' });
        },
      });
    }
  }

  goBack() {
    this.router.navigate(['/admin/forms']);
  }

  addField(type: FieldType) {
    const newField: FormField = {
      id: generateId(),
      fieldType: type,
      label: '',
      placeholder: null,
      required: false,
      fieldOrder: this.fields().length,
      options: type === 'select' ? [] : null,
      content: type === 'content' ? '' : null,
    };
    this.fields.update((f) => [...f, newField]);
    this.selectedField.set(newField);
  }

  removeField(id: string) {
    if (this.selectedField()?.id === id) {
      this.selectedField.set(null);
    }
    this.fields.update((f) => {
      const filtered = f.filter((field) => field.id !== id);
      return filtered.map((field, i) => ({ ...field, fieldOrder: i }));
    });
  }

  selectField(field: FormField) {
    this.selectedField.set(field);
  }

  onDrop(event: CdkDragDrop<FormField[]>) {
    this.fields.update((f) => {
      const arr = f.slice();
      moveItemInArray(arr, event.previousIndex, event.currentIndex);
      return arr.map((field, i) => ({ ...field, fieldOrder: i }));
    });
  }

  updateFieldProp(id: string, prop: keyof FormField, value: unknown) {
    this.fields.update((f) =>
      f.map((field) => (field.id === id ? { ...field, [prop]: value } : field))
    );
    // Keep selectedField in sync
    const updated = this.fields().find((f) => f.id === id);
    if (updated && this.selectedField()?.id === id) {
      this.selectedField.set(updated);
    }
  }

  addOption(fieldId: string) {
    const newOpt: FormFieldOption = { label: '', value: '' };
    this.fields.update((f) =>
      f.map((field) =>
        field.id === fieldId
          ? { ...field, options: [...(field.options ?? []), newOpt] }
          : field
      )
    );
    const updated = this.fields().find((f) => f.id === fieldId);
    if (updated) this.selectedField.set(updated);
  }

  removeOption(fieldId: string, index: number) {
    this.fields.update((f) =>
      f.map((field) =>
        field.id === fieldId
          ? { ...field, options: (field.options ?? []).filter((_, i) => i !== index) }
          : field
      )
    );
    const updated = this.fields().find((f) => f.id === fieldId);
    if (updated) this.selectedField.set(updated);
  }

  updateOption(fieldId: string, index: number, prop: 'label' | 'value', value: string) {
    this.fields.update((f) =>
      f.map((field) => {
        if (field.id !== fieldId) return field;
        const opts = (field.options ?? []).slice();
        opts[index] = { ...opts[index], [prop]: value };
        return { ...field, options: opts };
      })
    );
    const updated = this.fields().find((f) => f.id === fieldId);
    if (updated) this.selectedField.set(updated);
  }

  save() {
    const name = this.formNameValue().trim();
    if (!name) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Form name is required.' });
      this.isEditingName.set(true);
      return;
    }

    const description = this.formDescriptionValue().trim() || null;
    const currentId = this.formId();

    this.saving.set(true);

    if (currentId) {
      this.formService.updateForm(currentId, name, description, this.fields()).subscribe({
        next: (form) => {
          this.saving.set(false);
          // Re-sync local state from server response
          this.formNameValue.set(form.name);
          this.formDescriptionValue.set(form.description ?? '');
          this.fields.set(form.fields.slice().sort((a, b) => a.fieldOrder - b.fieldOrder));
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Form saved successfully.' });
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save form.' });
        },
      });
    } else {
      this.formService.createForm(name, description ?? undefined).subscribe({
        next: (form) => {
          this.saving.set(false);
          // Navigate to edit route so subsequent saves use updateForm
          this.router.navigate(['/admin/forms', form.id, 'edit']);
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create form.' });
        },
      });
    }
  }

  togglePublish() {
    const id = this.formId();
    if (!id) return;
    const isPublished = this.currentForm()?.status === 'published';
    this.publishing.set(true);
    const action = isPublished
      ? this.formService.unpublishForm(id)
      : this.formService.publishForm(id);

    action.subscribe({
      next: (form) => {
        this.publishing.set(false);
        const verb = form.status === 'published' ? 'Published' : 'Unpublished';
        this.messageService.add({ severity: 'success', summary: verb, detail: `Form is now ${form.status}.` });
      },
      error: () => {
        this.publishing.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update publish status.' });
      },
    });
  }
}
