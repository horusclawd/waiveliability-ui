import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { SubmissionService } from '../submission.service';
import { Submission } from '../submission.model';

type TagSeverity = 'warn' | 'success' | 'secondary' | 'info' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-submission-list',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ProgressSpinnerModule, CardModule],
  template: `
    <div class="router-fade">
      <h2 class="mt-0">Submissions</h2>

      @if (loading()) {
        <div class="flex justify-content-center p-6">
          <p-progressSpinner strokeWidth="4" style="width: 48px; height: 48px" />
        </div>
      } @else if (error()) {
        <p-card>
          <div class="text-center p-4">
            <i class="pi pi-exclamation-triangle text-orange-500" style="font-size: 2rem"></i>
            <p class="mt-2 text-color-secondary">{{ error() }}</p>
          </div>
        </p-card>
      } @else if (submissions().length === 0) {
        <p-card>
          <div class="text-center p-6">
            <i class="pi pi-inbox text-color-secondary" style="font-size: 3rem"></i>
            <p class="mt-2 text-color-secondary">No submissions yet.</p>
          </div>
        </p-card>
      } @else {
        <p-table
          [value]="submissions()"
          [tableStyle]="{ 'min-width': '50rem' }"
          styleClass="p-datatable-sm"
          [rowHover]="true"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Submitter Name</th>
              <th>Email</th>
              <th>Form ID</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-sub>
            <tr>
              <td>{{ sub.submitterName ?? '—' }}</td>
              <td>{{ sub.submitterEmail ?? '—' }}</td>
              <td class="text-color-secondary text-sm">{{ sub.formId }}</td>
              <td>
                <p-tag
                  [value]="sub.status | titlecase"
                  [severity]="statusSeverity(sub.status)"
                />
              </td>
              <td class="text-sm">{{ sub.submittedAt | date:'medium' }}</td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `,
})
export class SubmissionListComponent implements OnInit {
  private submissionService = inject(SubmissionService);

  submissions = this.submissionService.submissions;
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.submissionService.loadSubmissions().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.title ?? 'Failed to load submissions');
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
