import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';

import { SubmissionService } from '../submission.service';
import { Submission } from '../submission.model';
import { EmptyStateComponent } from '../../../core/components/empty-state/empty-state.component';

type TagSeverity = 'warn' | 'success' | 'secondary' | 'info' | 'danger' | 'contrast' | undefined;

interface StatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-submission-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    SkeletonModule,
    CardModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    ConfirmDialogModule,
    DialogModule,
    ToolbarModule,
    ToastModule,
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
          <h2 class="m-0 text-xl font-semibold">Submissions</h2>
        </ng-template>
        <ng-template #end>
          <p-button
            label="Export CSV"
            icon="pi pi-download"
            severity="secondary"
            (onClick)="downloadCsv()"
            ariaLabel="Export submissions to CSV"
          />
        </ng-template>
      </p-toolbar>

      <!-- Filter bar -->
      <div class="flex flex-wrap gap-3 mb-4 align-items-center">
        <p-select
          [options]="statusOptions"
          [(ngModel)]="filterStatus"
          optionLabel="label"
          optionValue="value"
          placeholder="Filter by status"
          [style]="{ 'min-width': '180px' }"
          (onChange)="applyFilters()"
        />
        <div class="flex gap-2 align-items-center">
          <input
            pInputText
            [(ngModel)]="filterName"
            placeholder="Search by name..."
            (keyup.enter)="applyFilters()"
            [style]="{ width: '220px' }"
          />
          <p-button
            icon="pi pi-search"
            severity="secondary"
            [outlined]="true"
            (onClick)="applyFilters()"
          />
        </div>

        @if (selectedRows.length > 0) {
          <p-button
            [label]="'Update Selected (' + selectedRows.length + ')'"
            icon="pi pi-sync"
            severity="info"
            (onClick)="bulkDialogVisible = true"
          />
        }
      </div>

      @if (loading()) {
        <!-- Filter bar skeleton -->
        <div class="flex flex-wrap gap-3 mb-4 align-items-center">
          <p-skeleton width="10rem" height="2.5rem" />
          <p-skeleton width="14rem" height="2.5rem" />
          <p-skeleton width="8rem" height="2.5rem" />
        </div>

        <!-- Table skeleton -->
        <p-table styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '60rem' }">
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem"><p-skeleton width="1.5rem" /></th>
              <th>Submitter Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Submitted</th>
              <th style="width: 16rem">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body">
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <tr>
                <td><p-skeleton width="1.5rem" /></td>
                <td><p-skeleton width="10rem" /></td>
                <td><p-skeleton width="12rem" /></td>
                <td><p-skeleton width="5rem" /></td>
                <td><p-skeleton width="8rem" /></td>
                <td><p-skeleton width="12rem" /></td>
              </tr>
            }
          </ng-template>
        </p-table>
      } @else if (error()) {
        <p-card>
          <div class="text-center p-4">
            <i class="pi pi-exclamation-triangle text-orange-500" style="font-size: 2rem"></i>
            <p class="mt-2 text-color-secondary">{{ error() }}</p>
          </div>
        </p-card>
      } @else if (submissions().length === 0) {
        <app-empty-state
          icon="inbox"
          title="No submissions found"
          message="Submissions will appear here once users submit your forms."
          actionLabel="Go to Forms"
          actionIcon="pi pi-file-edit"
          actionCallback={() => router.navigate(['/admin/forms'])"
        />
      } @else {
        <p-table
          [value]="submissions()"
          [tableStyle]="{ 'min-width': '60rem' }"
          styleClass="p-datatable-sm"
          [rowHover]="true"
          [(selection)]="selectedRows"
          dataKey="id"
          [paginator]="submissions().length > 10"
          [rows]="10"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem">
                <p-tableHeaderCheckbox />
              </th>
              <th>Submitter Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Submitted</th>
              <th style="width: 16rem">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-sub>
            <tr>
              <td>
                <p-tableCheckbox [value]="sub" />
              </td>
              <td>
                <a class="font-semibold cursor-pointer text-primary no-underline" (click)="viewSubmission(sub)">
                  {{ sub.submitterName ?? '\u2014' }}
                </a>
              </td>
              <td>{{ sub.submitterEmail ?? '\u2014' }}</td>
              <td>
                <p-tag
                  [value]="sub.status | titlecase"
                  [severity]="statusSeverity(sub.status)"
                />
              </td>
              <td class="text-sm">{{ sub.submittedAt | date:'medium' }}</td>
              <td>
                <div class="flex gap-2 align-items-center">
                  <p-select
                    [options]="changeStatusOptions"
                    [ngModel]="sub.status"
                    optionLabel="label"
                    optionValue="value"
                    [style]="{ 'min-width': '130px' }"
                    (onChange)="onStatusChange(sub, $event.value)"
                  />
                  <p-button
                    icon="pi pi-eye"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    (onClick)="viewSubmission(sub)"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    (onClick)="confirmDelete(sub)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }

      <!-- Bulk Status Update Dialog -->
      <p-dialog
        header="Update Status for Selected"
        [(visible)]="bulkDialogVisible"
        [modal]="true"
        [style]="{ width: '360px' }"
        [closable]="true"
        [draggable]="false"
      >
        <div class="flex flex-column gap-3 pt-2">
          <label class="font-medium">New Status</label>
          <p-select
            [options]="changeStatusOptions"
            [(ngModel)]="bulkStatus"
            optionLabel="label"
            optionValue="value"
            placeholder="Select status"
          />
        </div>
        <ng-template #footer>
          <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="bulkDialogVisible = false" />
          <p-button
            label="Update"
            icon="pi pi-check"
            [loading]="bulkUpdating()"
            (onClick)="applyBulkStatus()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class SubmissionListComponent implements OnInit {
  private submissionService = inject(SubmissionService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  submissions = this.submissionService.submissions;
  loading = signal(true);
  error = signal<string | null>(null);
  bulkUpdating = signal(false);

  filterStatus = '';
  filterName = '';
  bulkDialogVisible = false;
  bulkStatus = 'reviewed';

  selectedRows: Submission[] = [];

  statusOptions: StatusOption[] = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Archived', value: 'archived' },
  ];

  changeStatusOptions: StatusOption[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Archived', value: 'archived' },
  ];

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    const params: { status?: string; submitterName?: string } = {};
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterName.trim()) params.submitterName = this.filterName.trim();

    this.submissionService.loadSubmissions(params).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.title ?? 'Failed to load submissions');
      },
    });
  }

  applyFilters() {
    this.selectedRows = [];
    this.loadData();
  }

  // Keep selectedSubmissions signal in sync with p-table selection

  viewSubmission(sub: Submission) {
    this.router.navigate(['/admin/submissions', sub.id]);
  }

  onStatusChange(sub: Submission, newStatus: string) {
    if (newStatus === sub.status) return;
    this.submissionService.updateStatus(sub.id, newStatus).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: `Status changed to ${newStatus}.`,
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update status.',
        });
      },
    });
  }

  confirmDelete(sub: Submission) {
    this.confirmationService.confirm({
      message: `Delete submission from "${sub.submitterName ?? 'Unknown'}"? This cannot be undone.`,
      header: 'Delete Submission',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteSubmission(sub),
    });
  }

  deleteSubmission(sub: Submission) {
    this.submissionService.deleteSubmission(sub.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Submission deleted.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete submission.',
        });
      },
    });
  }

  applyBulkStatus() {
    if (!this.bulkStatus || this.selectedRows.length === 0) return;
    this.bulkUpdating.set(true);

    const targetStatus = this.bulkStatus;
    const total = this.selectedRows.length;

    // Use forkJoin to wait for all requests to complete
    const requests = this.selectedRows.map(sub =>
      this.submissionService.updateStatus(sub.id, targetStatus)
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.bulkUpdating.set(false);
        this.bulkDialogVisible = false;
        this.selectedRows = [];
        this.messageService.add({
          severity: 'success',
          summary: 'Bulk Update',
          detail: `${total} submission(s) updated to ${targetStatus}.`,
        });
      },
      error: () => {
        this.bulkUpdating.set(false);
        this.bulkDialogVisible = false;
        this.messageService.add({
          severity: 'warn',
          summary: 'Partial Update',
          detail: 'Some submissions could not be updated.',
        });
      },
    });
  }

  downloadCsv() {
    const params: { status?: string; submitterName?: string } = {};
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterName.trim()) params.submitterName = this.filterName.trim();

    this.submissionService.exportCsv(params).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'submissions.csv';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Export Failed',
          detail: 'Failed to export CSV. Please try again.',
        });
      },
    });
  }

  statusSeverity(status: Submission['status']): TagSeverity {
    switch (status) {
      case 'pending': return 'warn';
      case 'reviewed': return 'success';
      case 'archived': return 'secondary';
      default: return undefined;
    }
  }
}
