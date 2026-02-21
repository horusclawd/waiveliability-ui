import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToolbarModule } from 'primeng/toolbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuditLogService, AuditLog, AuditLogFilters } from './audit-log.service';

type TagSeverity = 'warn' | 'success' | 'secondary' | 'info' | 'danger' | 'contrast' | undefined;

interface ActionOption {
  label: string;
  value: string;
}

interface EntityTypeOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    CardModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    DatePickerModule,
    ToolbarModule,
    SkeletonModule,
    TooltipModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="router-fade p-4">
      <p-toolbar styleClass="mb-4">
        <ng-template #start>
          <h2 class="m-0 text-xl font-semibold">Audit Logs</h2>
        </ng-template>
        <ng-template #end>
          <p-button
            label="Export CSV"
            icon="pi pi-download"
            severity="secondary"
            [outlined]="true"
            (onClick)="exportLogs()"
            pTooltip="Export filtered logs to CSV"
          />
        </ng-template>
      </p-toolbar>

      <!-- Filters -->
      <p-card class="mb-4">
        <div class="flex flex-wrap gap-3 align-items-end">
          <div class="flex flex-column gap-1">
            <label for="actionFilter" class="text-sm font-medium">Action</label>
            <p-select
              id="actionFilter"
              [options]="actionOptions"
              [(ngModel)]="filters.action"
              optionLabel="label"
              optionValue="value"
              placeholder="All actions"
              [showClear]="true"
              [style]="{ 'min-width': '180px' }"
              (onChange)="applyFilters()"
            />
          </div>

          <div class="flex flex-column gap-1">
            <label for="entityFilter" class="text-sm font-medium">Entity Type</label>
            <p-select
              id="entityFilter"
              [options]="entityTypeOptions"
              [(ngModel)]="filters.entityType"
              optionLabel="label"
              optionValue="value"
              placeholder="All types"
              [showClear]="true"
              [style]="{ 'min-width': '160px' }"
              (onChange)="applyFilters()"
            />
          </div>

          <div class="flex flex-column gap-1">
            <label for="userFilter" class="text-sm font-medium">User</label>
            <input
              id="userFilter"
              pInputText
              [(ngModel)]="filters.userName"
              placeholder="Search by name..."
              [style]="{ width: '180px' }"
              (keyup.enter)="applyFilters()"
            />
          </div>

          <div class="flex flex-column gap-1">
            <label for="startDate" class="text-sm font-medium">From</label>
            <p-datepicker
              id="startDate"
              [(ngModel)]="filters.startDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              [style]="{ 'min-width': '150px' }"
              (onSelect)="applyFilters()"
            />
          </div>

          <div class="flex flex-column gap-1">
            <label for="endDate" class="text-sm font-medium">To</label>
            <p-datepicker
              id="endDate"
              [(ngModel)]="filters.endDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              [style]="{ 'min-width': '150px' }"
              (onSelect)="applyFilters()"
            />
          </div>

          <p-button
            icon="pi pi-filter-slash"
            severity="secondary"
            [text]="true"
            pTooltip="Clear filters"
            (onClick)="clearFilters()"
          />
        </div>
      </p-card>

      <!-- Loading skeleton -->
      @if (loading()) {
        <p-card>
          <p-table styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '60rem' }">
            <ng-template pTemplate="header">
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body">
              @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
                <tr>
                  <td><p-skeleton width="10rem" /></td>
                  <td><p-skeleton width="12rem" /><br /><p-skeleton width="8rem" styleClass="mt-1" /></td>
                  <td><p-skeleton width="8rem" /></td>
                  <td><p-skeleton width="6rem" /></td>
                  <td><p-skeleton width="4rem" /></td>
                </tr>
              }
            </ng-template>
          </p-table>
        </p-card>
      } @else if (logs().length === 0) {
        <!-- Empty state -->
        <p-card>
          <div class="flex flex-column align-items-center justify-content-center p-6 text-center">
            <div class="empty-state-icon bg-primary-50 border-circle mb-4">
              <i class="pi pi-history text-primary" style="font-size: 3rem"></i>
            </div>
            <h3 class="text-xl font-semibold m-0 mb-2">No audit logs found</h3>
            <p class="text-color-secondary m-0 mb-4 max-w-25rem">
              No activity matches your current filters. Try adjusting your search criteria.
            </p>
            <p-button
              label="Clear Filters"
              icon="pi pi-filter-slash"
              severity="secondary"
              [outlined]="true"
              (onClick)="clearFilters()"
            />
          </div>
        </p-card>
      } @else {
        <!-- Logs table -->
        <p-card>
          <p-table
            [value]="logs()"
            [paginator]="true"
            [rows]="20"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="{first} - {last} of {totalRecords} logs"
            [tableStyle]="{ 'min-width': '60rem' }"
            styleClass="p-datatable-sm"
            [rowHover]="true"
          >
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="createdAt" style="width: 12rem">
                  Timestamp <p-sortIcon field="createdAt" />
                </th>
                <th>User</th>
                <th pSortableColumn="action" style="width: 12rem">
                  Action <p-sortIcon field="action" />
                </th>
                <th style="width: 10rem">Entity Type</th>
                <th>Entity</th>
                <th style="width: 5rem">Details</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-log>
              <tr>
                <td class="text-sm">
                  {{ log.createdAt | date: 'medium' }}
                </td>
                <td>
                  <div class="font-semibold">{{ log.userName }}</div>
                  <div class="text-sm text-color-secondary">{{ log.userEmail }}</div>
                </td>
                <td>
                  <p-tag
                    [value]="formatAction(log.action)"
                    [severity]="actionSeverity(log.action)"
                  />
                </td>
                <td>
                  <span class="text-capitalize">{{ formatEntityType(log.entityType) }}</span>
                </td>
                <td>
                  @if (log.entityName) {
                    <span class="font-medium">{{ log.entityName }}</span>
                  } @else if (log.entityId) {
                    <span class="text-color-secondary font-mono text-sm">{{ log.entityId }}</span>
                  } @else {
                    <span class="text-color-secondary">—</span>
                  }
                </td>
                <td>
                  @if (log.details) {
                    <p-button
                      icon="pi pi-eye"
                      [rounded]="true"
                      [text]="true"
                      severity="secondary"
                      pTooltip="View details"
                      (onClick)="viewDetails(log)"
                    />
                  } @else {
                    <span class="text-color-secondary">—</span>
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      }

      <!-- Details Dialog -->
      <p-dialog
        header="Audit Log Details"
        [(visible)]="detailsDialogVisible"
        [modal]="true"
        [style]="{ width: '500px' }"
        [closable]="true"
      >
        @if (selectedLog()) {
          <div class="flex flex-column gap-3">
            <div class="flex flex-column gap-1">
              <span class="text-color-secondary text-sm">ID</span>
              <span class="font-mono text-sm">{{ selectedLog()!.id }}</span>
            </div>
            <div class="flex flex-column gap-1">
              <span class="text-color-secondary text-sm">Timestamp</span>
              <span>{{ selectedLog()!.createdAt | date: 'medium' }}</span>
            </div>
            <div class="flex flex-column gap-1">
              <span class="text-color-secondary text-sm">User</span>
              <span>{{ selectedLog()!.userName }} ({{ selectedLog()!.userEmail }})</span>
            </div>
            <div class="flex flex-column gap-1">
              <span class="text-color-secondary text-sm">IP Address</span>
              <span class="font-mono">{{ selectedLog()!.ipAddress ?? 'N/A' }}</span>
            </div>
            <div class="flex flex-column gap-1">
              <span class="text-color-secondary text-sm">Action</span>
              <span>{{ formatAction(selectedLog()!.action) }}</span>
            </div>
            @if (selectedLog()!.details) {
              <div class="flex flex-column gap-1">
                <span class="text-color-secondary text-sm">Details</span>
                <pre class="surface-50 p-3 border-round text-sm overflow-auto" style="max-height: 200px">{{ selectedLog()!.details | json }}</pre>
              </div>
            }
          </div>
        }
      </p-dialog>
    </div>
  `,
  styles: [`
    .empty-state-icon {
      width: 5rem;
      height: 5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
  `],
})
export class AuditLogsComponent implements OnInit {
  private auditLogService = inject(AuditLogService);
  private messageService = inject(MessageService);

  logs = this.auditLogService.logs;
  loading = this.auditLogService.loading;

  filters: AuditLogFilters = {};
  selectedLog = signal<AuditLog | null>(null);
  detailsDialogVisible = false;

  actionOptions: ActionOption[] = [
    { label: 'Created', value: 'CREATED' },
    { label: 'Updated', value: 'UPDATED' },
    { label: 'Deleted', value: 'DELETED' },
    { label: 'Viewed', value: 'VIEWED' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Status Changed', value: 'STATUS_CHANGED' },
    { label: 'Invited', value: 'INVITED' },
    { label: 'Removed', value: 'REMOVED' },
  ];

  entityTypeOptions: EntityTypeOption[] = [
    { label: 'Form', value: 'form' },
    { label: 'Submission', value: 'submission' },
    { label: 'Team Member', value: 'team_member' },
    { label: 'Tenant', value: 'tenant' },
    { label: 'Settings', value: 'settings' },
  ];

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.auditLogService.getAuditLogs(this.filters).subscribe({
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load audit logs.',
        });
      },
    });
  }

  applyFilters() {
    this.loadLogs();
  }

  clearFilters() {
    this.filters = {};
    this.loadLogs();
  }

  exportLogs() {
    this.auditLogService.exportAuditLogs(this.filters).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: 'Exported',
          detail: 'Audit logs exported successfully.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Export Failed',
          detail: 'Failed to export audit logs.',
        });
      },
    });
  }

  viewDetails(log: AuditLog) {
    this.selectedLog.set(log);
    this.detailsDialogVisible = true;
  }

  formatAction(action: string): string {
    return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }

  formatEntityType(entityType: string): string {
    return entityType.replace(/_/g, ' ');
  }

  actionSeverity(action: string): TagSeverity {
    const severityMap: Record<string, TagSeverity> = {
      CREATED: 'success',
      UPDATED: 'info',
      DELETED: 'danger',
      VIEWED: 'secondary',
      SUBMITTED: 'warn',
      STATUS_CHANGED: 'warn',
      INVITED: 'info',
      REMOVED: 'danger',
    };
    return severityMap[action] || 'secondary';
  }
}
