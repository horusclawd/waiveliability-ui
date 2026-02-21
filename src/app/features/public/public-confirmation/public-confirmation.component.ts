import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { environment } from '../../../../environments/environment';

interface SubmissionResponse {
  id: string;
  pdfUrl: string | null;
}

@Component({
  selector: 'app-public-confirmation',
  standalone: true,
  imports: [CommonModule, CardModule, DividerModule, ButtonModule, ProgressSpinnerModule],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--surface-ground)">
      <p-card styleClass="w-full text-center" [style]="{ 'max-width': '480px' }">
        <div class="flex flex-column align-items-center gap-3 p-4">
          <i class="pi pi-check-circle text-green-500" style="font-size: 4rem"></i>
          <h2 class="m-0">Thank You!</h2>
          <p class="m-0 text-color-secondary">Your form has been submitted successfully.</p>
          <p-divider />

          @if (pdfUrl()) {
            <div class="flex flex-column align-items-center gap-2">
              <i class="pi pi-file-pdf text-red-500" style="font-size: 2rem"></i>
              <p class="m-0 text-sm">Here is a signed copy of your form:</p>
              <p-button
                label="Download PDF"
                icon="pi pi-download"
                (onClick)="downloadPdf()"
              />
            </div>
          } @else if (loading()) {
            <div class="flex flex-column align-items-center gap-2">
              <p-progressSpinner strokeWidth="4" style="width: 32px; height: 32px" />
              <p class="m-0 text-sm text-color-secondary">Generating your PDF...</p>
            </div>
          } @else if (error()) {
            <p class="m-0 text-sm text-color-secondary">
              <i class="pi pi-info-circle mr-1"></i>
              {{ error() }}
            </p>
          } @else {
            <p class="m-0 text-sm text-color-secondary">
              <i class="pi pi-file-pdf mr-1"></i>
              A signed PDF copy is being generated and will be available shortly.
            </p>
          }
        </div>
      </p-card>
    </div>
  `,
})
export class PublicConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  pdfUrl = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  private tenantSlug = '';
  private pollCount = 0;
  private readonly MAX_POLLS = 10;

  ngOnInit() {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') || '';
    const submissionId = this.route.snapshot.queryParamMap.get('submissionId');
    if (submissionId && this.tenantSlug) {
      this.checkPdf(submissionId);
    } else {
      this.loading.set(false);
    }
  }

  private checkPdf(submissionId: string) {
    this.http
      .get<SubmissionResponse>(`${environment.apiBaseUrl}/public/${this.tenantSlug}/submissions/${submissionId}`)
      .subscribe({
        next: (response) => {
          if (response.pdfUrl) {
            this.pdfUrl.set(response.pdfUrl);
            this.loading.set(false);
          } else if (this.pollCount < this.MAX_POLLS) {
            this.pollCount++;
            setTimeout(() => this.checkPdf(submissionId), 3000);
          } else {
            this.error.set('PDF is taking longer than expected. It will be available in your email.');
            this.loading.set(false);
          }
        },
        error: () => {
          this.error.set('Unable to retrieve PDF. Please try again later.');
          this.loading.set(false);
        },
      });
  }

  downloadPdf() {
    const url = this.pdfUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }
}
