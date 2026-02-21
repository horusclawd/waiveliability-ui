import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { FormService } from '../form.service';
import { FormSummary } from '../form.model';
import { TenantService } from '../../../core/tenant/tenant.service';
import { ImportDialogComponent } from '../import-dialog/import-dialog.component';
import { EmptyStateComponent } from '../../../core/components/empty-state/empty-state.component';

@Component({
  selector: 'app-form-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    ProgressSpinnerModule,
    SkeletonModule,
    TooltipModule,
    ImportDialogComponent,
    EmptyStateComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="router-fade p-4">
      <p-toast />
      <p-confirmdialog />

      <!-- Toolbar -->
      <p-toolbar styleClass="mb-4">
        <ng-template #start>
          <h2 class="m-0 text-xl font-semibold">Forms</h2>
        </ng-template>
        <ng-template #end>
          <p-button
            label="Import"
            icon="pi pi-upload"
            severity="secondary"
            class="mr-2"
            (onClick)="importDialogVisible = true"
            ariaLabel="Import form"
          />
          <p-button
            label="New Form"
            icon="pi pi-plus"
            (onClick)="openCreateDialog()"
            ariaLabel="Create new form"
          />
        </ng-template>
      </p-toolbar>

      <!-- Loading skeleton -->
      @if (loading()) {
        <p-card styleClass="mb-4">
          <p-skeleton width="100%" height="40px" styleClass="mb-3" />
          <p-table styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Fields</th>
                <th>Updated</th>
                <th style="width: 10rem">Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body">
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <tr>
                  <td><p-skeleton width="12rem" /><br /><p-skeleton width="8rem" styleClass="mt-1" /></td>
                  <td><p-skeleton width="5rem" /></td>
                  <td><p-skeleton width="3rem" /></td>
                  <td><p-skeleton width="6rem" /></td>
                  <td><p-skeleton width="8rem" /></td>
                </tr>
              }
            </ng-template>
          </p-table>
        </p-card>
      }

      <!-- Table -->
      @if (!loading()) {
        <p-table
          [value]="formService.forms()"
          [paginator]="formService.forms().length > 10"
          [rows]="10"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{first} – {last} of {totalRecords}"
          dataKey="id"
          styleClass="p-datatable-sm"
        >
          <ng-template #empty>
            <tr>
              <td colspan="5">
                <app-empty-state
                  icon="file"
                  title="No forms yet"
                  message="Create your first form to start collecting submissions."
                  actionLabel="New Form"
                  actionIcon="pi pi-plus"
                  [actionCallback]="openCreateDialog.bind(this)"
                />
              </td>
            </tr>
          </ng-template>

          <ng-template #header>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Fields</th>
              <th>Updated</th>
              <th style="width: 10rem">Actions</th>
            </tr>
          </ng-template>

          <ng-template #body let-form>
            <tr>
              <td>
                <span class="font-semibold">{{ form.name }}</span>
                @if (form.description) {
                  <div class="text-sm text-color-secondary">{{ form.description }}</div>
                }
              </td>
              <td>
                <p-tag
                  [value]="form.status === 'published' ? 'Published' : 'Draft'"
                  [severity]="form.status === 'published' ? 'success' : 'secondary'"
                />
              </td>
              <td>{{ form.fieldCount }}</td>
              <td>{{ form.updatedAt | date: 'mediumDate' }}</td>
              <td>
                <div class="flex gap-1">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    pTooltip="Edit"
                    (onClick)="editForm(form)"
                  />
                  <p-button
                    icon="pi pi-copy"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    pTooltip="Duplicate"
                    (onClick)="duplicateForm(form)"
                  />
                  @if (form.status === 'published') {
                    <p-button
                      icon="pi pi-link"
                      [rounded]="true"
                      [text]="true"
                      severity="secondary"
                      pTooltip="Copy Public Link"
                      (onClick)="copyPublicLink(form)"
                    />
                  }
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    pTooltip="Delete"
                    (onClick)="confirmDelete(form)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }

      <!-- Create Form Dialog -->
      <p-dialog
        header="New Form"
        [(visible)]="createDialogVisible"
        [modal]="true"
        [style]="{ width: '420px' }"
        [closable]="true"
        [draggable]="false"
      >
        <div class="flex flex-column gap-3 pt-2">
          <div class="flex flex-column gap-1">
            <label for="formName" class="font-medium">Name <span class="text-red-500">*</span></label>
            <input
              id="formName"
              pInputText
              [(ngModel)]="newFormName"
              placeholder="e.g. Customer Waiver"
              [ngClass]="{ 'ng-invalid ng-dirty': nameError }"
            />
            @if (nameError) {
              <small class="text-red-500">Name is required.</small>
            }
          </div>

          <div class="flex flex-column gap-1">
            <label for="formDesc" class="font-medium">Description <span class="text-color-secondary">(optional)</span></label>
            <textarea
              id="formDesc"
              pTextarea
              [(ngModel)]="newFormDescription"
              placeholder="Brief description of this form"
              rows="3"
              style="resize: none"
            ></textarea>
          </div>
        </div>

        <ng-template #footer>
          <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="closeCreateDialog()" />
          <p-button label="Create" icon="pi pi-check" [loading]="creating()" (onClick)="submitCreate()" />
        </ng-template>
      </p-dialog>

      <app-import-dialog
        [(visible)]="importDialogVisible"
        (formCreated)="onImportFormCreated()"
      />
    </div>
  `,
})
export class FormListComponent implements OnInit {
  createDialogVisible = false;
  importDialogVisible = false;
  newFormName = '';
  newFormDescription = '';
  nameError = false;

  loading = signal(false);
  creating = signal(false);

  constructor(
    public formService: FormService,
    private tenantService: TenantService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loading.set(true);
    // Load tenant to get slug for public link
    this.tenantService.load().subscribe();
    this.formService.loadForms().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load forms.' });
      },
    });
  }

  editForm(form: FormSummary) {
    this.router.navigate(['/admin/forms', form.id, 'edit']);
  }

  duplicateForm(form: FormSummary) {
    this.formService.duplicateForm(form.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Duplicated', detail: `"Copy of ${form.name}" created.` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to duplicate form.' });
      },
    });
  }

  copyPublicLink(form: FormSummary) {
    const tenantSlug = this.tenantService.tenant()?.slug;
    if (!tenantSlug) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Tenant slug not found.' });
      return;
    }

    const publicUrl = `${window.location.origin}/public/${tenantSlug}/forms/${form.id}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'Public link copied to clipboard!' });
    }).catch(() => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy link.' });
    });
  }

  confirmDelete(form: FormSummary) {
    this.confirmationService.confirm({
      message: `Delete "${form.name}"? This cannot be undone.`,
      header: 'Delete Form',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteForm(form),
    });
  }

  deleteForm(form: FormSummary) {
    this.formService.deleteForm(form.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `"${form.name}" was deleted.` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete form.' });
      },
    });
  }

  openCreateDialog() {
    this.newFormName = '';
    this.newFormDescription = '';
    this.nameError = false;
    this.createDialogVisible = true;
  }

  closeCreateDialog() {
    this.createDialogVisible = false;
  }

  onImportFormCreated() {
    this.formService.loadForms().subscribe();
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Form imported successfully!' });
  }

  submitCreate() {
    if (!this.newFormName.trim()) {
      this.nameError = true;
      return;
    }
    this.nameError = false;
    this.creating.set(true);
    this.formService
      .createForm(this.newFormName.trim(), this.newFormDescription.trim() || undefined)
      .subscribe({
        next: (form) => {
          this.creating.set(false);
          this.createDialogVisible = false;
          this.router.navigate(['/admin/forms', form.id, 'edit']);
        },
        error: () => {
          this.creating.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create form.' });
        },
      });
  }
}
