import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { CustomDomainService, CustomDomain } from './custom-domain.service';

type TagSeverity = 'warn' | 'success' | 'secondary' | 'info' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-custom-domain',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    SkeletonModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmdialog />

    <div class="router-fade">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="mt-0">Custom Domain</h2>
      </div>

      <p class="text-color-secondary mb-4">
        Connect your own domain to use with your forms. This allows you to have a branded URL for your waiver forms.
      </p>

      @if (loading()) {
        <!-- Loading skeleton -->
        <p-card>
          <div class="flex flex-column gap-3">
            <p-skeleton width="100%" height="2rem" />
            <p-skeleton width="60%" height="2rem" />
          </div>
        </p-card>
      } @else if (!domain()) {
        <!-- No domain set -->
        <p-card>
          <div class="flex flex-column gap-4">
            <div class="flex flex-column gap-2">
              <label for="domainInput" class="font-medium">Your Domain</label>
              <div class="flex gap-2">
                <input
                  id="domainInput"
                  pInputText
                  [(ngModel)]="newDomain"
                  placeholder="example.com"
                  class="flex-1"
                  [disabled]="saving()"
                />
                <p-button
                  label="Connect"
                  icon="pi pi-link"
                  [loading]="saving()"
                  [disabled]="!newDomain || !isValidDomain(newDomain)"
                  (onClick)="connectDomain()"
                />
              </div>
              <small class="text-color-secondary">
                Enter your custom domain (e.g., waivers.yourcompany.com)
              </small>
            </div>

            <p-divider />

            <div class="surface-50 p-4 border-round">
              <h4 class="mt-0 mb-2">How it works</h4>
              <ol class="m-0 p-0 pl-3 text-color-secondary">
                <li class="mb-2">Enter your custom domain above</li>
                <li class="mb-2">We'll provide DNS records to add to your domain</li>
                <li class="mb-2">Once verified, your forms will be available on your domain</li>
              </ol>
            </div>
          </div>
        </p-card>
      } @else {
        <!-- Domain is configured -->
        <p-card>
          <div class="flex flex-column gap-4">
            <!-- Domain status -->
            <div class="flex justify-content-between align-items-center">
              <div>
                <h3 class="mt-0 mb-1">{{ domain()!.domain }}</h3>
                <p-tag
                  [value]="getStatusLabel(domain()!.status)"
                  [severity]="getStatusSeverity(domain()!.status)"
                />
              </div>
              <p-button
                label="Remove"
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                (onClick)="confirmRemove()"
              />
            </div>

            <p-divider />

            <!-- Verification details -->
            @if (verification()) {
              <div class="flex flex-column gap-3">
                <h4 class="mt-0">DNS Configuration</h4>
                <p class="text-color-secondary mb-2">
                  Add the following TXT record to your DNS settings to verify ownership:
                </p>

                <div class="grid">
                  <div class="col-12 md:col-6">
                    <div class="surface-50 p-3 border-round">
                      <div class="text-sm text-color-secondary mb-1">TXT Record</div>
                      <div class="font-mono font-semibold">{{ verification()!.txtRecord }}</div>
                    </div>
                  </div>
                  <div class="col-12 md:col-6">
                    <div class="surface-50 p-3 border-round">
                      <div class="text-sm text-color-secondary mb-1">Value</div>
                      <div class="font-mono font-semibold word-break">{{ verification()!.expectedValue }}</div>
                    </div>
                  </div>
                </div>

                @if (verification()!.cnameRecord) {
                  <div class="grid">
                    <div class="col-12">
                      <div class="surface-50 p-3 border-round">
                        <div class="text-sm text-color-secondary mb-1">CNAME Record (optional)</div>
                        <div class="font-mono font-semibold">{{ verification()!.cnameRecord }}</div>
                      </div>
                    </div>
                  </div>
                }

                <div class="flex gap-2 mt-2">
                  <p-button
                    label="Verify Now"
                    icon="pi pi-check-circle"
                    [loading]="verifying()"
                    (onClick)="verifyDomain()"
                  />
                  <p-button
                    label="Check Status"
                    icon="pi pi-refresh"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="checkStatus()"
                  />
                </div>
              </div>
            }

            <!-- SSL Status -->
            @if (domain()!.sslStatus) {
              <>
                <p-divider />
                <div class="flex flex-column gap-2">
                  <h4 class="mt-0">SSL Certificate</h4>
                  <div class="flex align-items-center gap-2">
                    <p-tag
                      [value]="getSslStatusLabel(domain()!.sslStatus!)"
                      [severity]="getSslStatusSeverity(domain()!.sslStatus!)"
                    />
                    @if (domain()!.sslExpiresAt) {
                      <span class="text-sm text-color-secondary">
                        Expires: {{ domain()!.sslExpiresAt | date: 'mediumDate' }}
                      </span>
                    }
                  </div>
                </div>
              </>
            }

            <!-- Active domain info -->
            @if (domain()!.status === 'active') {
              <>
                <p-divider />
                <div class="surface-50 p-4 border-round">
                  <h4 class="mt-0 mb-2">Your forms are live!</h4>
                  <p class="text-color-secondary m-0">
                    Your forms are now available at: <br />
                    <a [href]="'https://' + domain()!.domain" target="_blank" class="font-semibold">
                      https://{{ domain()!.domain }}
                    </a>
                  </p>
                </div>
              </>
            }
          </div>
        </p-card>
      }
    </div>
  `,
  styles: [`
    .word-break {
      word-break: break-all;
    }
  `],
})
export class CustomDomainComponent implements OnInit {
  private customDomainService = inject(CustomDomainService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  domain = this.customDomainService.domain;
  verification = this.customDomainService.verification;
  loading = this.customDomainService.loading;
  verifying = this.customDomainService.verifying;

  newDomain = '';
  saving = signal(false);

  ngOnInit() {
    this.loadDomain();
  }

  loadDomain() {
    this.customDomainService.getCustomDomain().subscribe({
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load custom domain settings.',
        });
      },
    });
  }

  isValidDomain(domain: string): boolean {
    // Basic domain validation
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  connectDomain() {
    if (!this.isValidDomain(this.newDomain)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Domain',
        detail: 'Please enter a valid domain name.',
      });
      return;
    }

    this.saving.set(true);
    this.customDomainService.setCustomDomain(this.newDomain).subscribe({
      next: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Domain Added',
          detail: 'Please configure your DNS settings to verify ownership.',
        });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to add custom domain. Please try again.',
        });
      },
    });
  }

  verifyDomain() {
    this.customDomainService.verifyCustomDomain().subscribe({
      next: (verification) => {
        this.messageService.add({
          severity: 'info',
          summary: 'Verification Sent',
          detail: 'Please add the DNS records and click "Check Status" to verify.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to start verification. Please try again.',
        });
      },
    });
  }

  checkStatus() {
    this.customDomainService.checkVerificationStatus().subscribe({
      next: (domain) => {
        const statusMessages: Record<string, string> = {
          pending: 'Domain verification is still in progress.',
          verified: 'Domain verified successfully!',
          active: 'Domain is active!',
          failed: 'Domain verification failed. Please check your DNS settings.',
        };
        this.messageService.add({
          severity: domain.status === 'active' || domain.status === 'verified' ? 'success' : 'info',
          summary: 'Status Check',
          detail: statusMessages[domain.status] || 'Status updated.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to check domain status.',
        });
      },
    });
  }

  confirmRemove() {
    this.confirmationService.confirm({
      message: `Remove custom domain "${this.domain()!.domain}"? Your forms will no longer be available on this domain.`,
      header: 'Remove Custom Domain',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.removeDomain(),
    });
  }

  removeDomain() {
    this.customDomainService.removeCustomDomain().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Domain Removed',
          detail: 'Custom domain has been removed.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove custom domain.',
        });
      },
    });
  }

  getStatusLabel(status: CustomDomain['status']): string {
    const labels: Record<string, string> = {
      pending: 'Pending Verification',
      verified: 'Verified',
      active: 'Active',
      failed: 'Verification Failed',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: CustomDomain['status']): TagSeverity {
    const severityMap: Record<string, TagSeverity> = {
      pending: 'warn',
      verified: 'info',
      active: 'success',
      failed: 'danger',
    };
    return severityMap[status] || 'secondary';
  }

  getSslStatusLabel(status: string | null): string {
    if (!status) return 'N/A';
    const labels: Record<string, string> = {
      pending: 'SSL Pending',
      active: 'SSL Active',
      failed: 'SSL Failed',
    };
    return labels[status] || status;
  }

  getSslStatusSeverity(status: string | null): TagSeverity {
    if (!status) return 'secondary';
    const severityMap: Record<string, TagSeverity> = {
      pending: 'warn',
      active: 'success',
      failed: 'danger',
    };
    return severityMap[status] || 'secondary';
  }
}
