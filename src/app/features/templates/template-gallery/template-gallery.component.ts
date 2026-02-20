import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TemplateService } from '../template.service';

@Component({
  selector: 'app-template-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    SelectButtonModule,
    ToolbarModule,
    ProgressSpinnerModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="router-fade p-4">
      <p-toast />

      <!-- Toolbar -->
      <p-toolbar styleClass="mb-4">
        <ng-template #start>
          <h2 class="m-0 text-xl font-semibold">Templates</h2>
        </ng-template>
        <ng-template #end>
          <p-selectButton
            [options]="categoryOptions"
            [(ngModel)]="selectedCategory"
            optionLabel="label"
            optionValue="value"
            (onChange)="onCategoryChange()"
          />
        </ng-template>
      </p-toolbar>

      <!-- Loading spinner -->
      @if (loading()) {
        <div class="flex justify-content-center align-items-center" style="min-height: 200px">
          <p-progressSpinner strokeWidth="4" style="width: 48px; height: 48px" />
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && templateService.templates().length === 0) {
        <div class="flex justify-content-center align-items-center" style="min-height: 200px">
          <p class="text-color-secondary">No templates found.</p>
        </div>
      }

      <!-- Template grid -->
      @if (!loading() && templateService.templates().length > 0) {
        <div class="grid">
          @for (template of templateService.templates(); track template.id) {
            <div class="col-12 md:col-6 lg:col-4">
              <p-card styleClass="h-full">
                <ng-template #header>
                  <div class="flex align-items-center justify-content-between px-3 pt-3">
                    <p-tag
                      [value]="template.category | titlecase"
                      severity="info"
                    />
                    @if (template.isPremium) {
                      <p-tag value="Premium" severity="warn" icon="pi pi-star" />
                    }
                  </div>
                </ng-template>

                <div class="flex flex-column gap-2">
                  <h3 class="m-0 text-lg font-semibold">{{ template.name }}</h3>
                  @if (template.description) {
                    <p class="m-0 text-color-secondary text-sm">{{ template.description }}</p>
                  }
                  <div class="flex gap-3 text-sm text-color-secondary mt-1">
                    <span><i class="pi pi-list mr-1"></i>{{ template.fieldCount }} fields</span>
                    <span><i class="pi pi-users mr-1"></i>{{ template.usageCount }} uses</span>
                  </div>
                </div>

                <ng-template #footer>
                  <p-button
                    label="Use Template"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    [loading]="importingId() === template.id"
                    [disabled]="importingId() !== null && importingId() !== template.id"
                    (onClick)="useTemplate(template.id)"
                    styleClass="w-full"
                  />
                </ng-template>
              </p-card>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class TemplateGalleryComponent implements OnInit {
  templateService = inject(TemplateService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loading = signal(false);
  importingId = signal<string | null>(null);

  categoryOptions = [
    { label: 'All', value: null },
    { label: 'Waiver', value: 'waiver' },
    { label: 'Legal', value: 'legal' },
    { label: 'Consent', value: 'consent' },
  ];
  selectedCategory: string | null = null;

  ngOnInit() {
    this.loadTemplates();
  }

  onCategoryChange() {
    this.loadTemplates();
  }

  private loadTemplates() {
    this.loading.set(true);
    this.templateService.loadTemplates(this.selectedCategory).subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load templates.' });
      },
    });
  }

  useTemplate(id: string) {
    this.importingId.set(id);
    this.templateService.importTemplate(id).subscribe({
      next: (form) => {
        this.importingId.set(null);
        this.router.navigate(['/admin/forms', form.id, 'edit']);
      },
      error: () => {
        this.importingId.set(null);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to import template.' });
      },
    });
  }
}
