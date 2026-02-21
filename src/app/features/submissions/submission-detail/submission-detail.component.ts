import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToolbarModule } from 'primeng/toolbar';
import { SubmissionService } from '../submission.service';
import { Submission } from '../submission.model';

type TagSeverity = 'warn' | 'success' | 'secondary' | 'info' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ProgressSpinnerModule,
    ToolbarModule,
  ],
  template: `
    <div class="router-fade p-4">

      <p-toolbar styleClass="mb-4">
        <ng-template #start>
          <p-button
            icon="pi pi-arrow-left"
            label="Submissions"
            severity="secondary"
            [text]="true"
            (onClick)="back()"
          />
        </ng-template>
        <ng-template #end>
          @if (submission()) {
            <p-tag
              [value]="submission()!.status | titlecase"
              [severity]="statusSeverity(submission()!.status)"
            />
          }
        </ng-template>
      </p-toolbar>

      @if (loading()) {
        <div class="flex justify-content-center p-6">
          <p-progressSpinner strokeWidth="4" style="width: 48px; height: 48px" />
        </div>
      }

      @if (!loading() && !submission()) {
        <p-card>
          <div class="text-center p-4 text-color-secondary">Submission not found.</div>
        </p-card>
      }

      @if (submission(); as sub) {
        <div class="flex flex-column gap-3">

          <!-- Metadata -->
          <p-card header="Submitter">
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="text-sm text-color-secondary mb-1">Name</div>
                <div class="font-semibold">{{ sub.submitterName ?? '—' }}</div>
              </div>
              <div class="col-12 md:col-6">
                <div class="text-sm text-color-secondary mb-1">Email</div>
                <div class="font-semibold">{{ sub.submitterEmail ?? '—' }}</div>
              </div>
              <div class="col-12 md:col-6">
                <div class="text-sm text-color-secondary mb-1">Submitted</div>
                <div>{{ sub.submittedAt | date:'medium' }}</div>
              </div>
              <div class="col-12 md:col-6">
                <div class="text-sm text-color-secondary mb-1">Submission ID</div>
                <div class="text-sm font-mono">{{ sub.id }}</div>
              </div>
            </div>
          </p-card>

          <!-- Answers -->
          <p-card header="Form Answers">
            @if (answers().length === 0) {
              <p class="text-color-secondary m-0">No answers recorded.</p>
            }
            @for (answer of answers(); track answer.key; let last = $last) {
              <div class="py-2">
                <div class="text-sm text-color-secondary mb-1">{{ answer.key }}</div>
                <div>{{ answer.value }}</div>
              </div>
              @if (!last) {
                <p-divider styleClass="my-0" />
              }
            }
          </p-card>

        </div>
      }
    </div>
  `,
})
export class SubmissionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private submissionService = inject(SubmissionService);

  submission = signal<Submission | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.submissionService.getSubmission(id).subscribe({
      next: (s) => {
        this.submission.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get answers(): () => { key: string; value: string }[] {
    return () => {
      const s = this.submission();
      if (!s) return [];
      return Object.entries(s.formData).map(([key, val]) => ({
        key,
        value: typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val),
      }));
    };
  }

  statusSeverity(status: Submission['status']): TagSeverity {
    switch (status) {
      case 'pending': return 'warn';
      case 'reviewed': return 'success';
      case 'archived': return 'secondary';
      default: return undefined;
    }
  }

  back() {
    this.router.navigate(['/admin/submissions']);
  }
}
