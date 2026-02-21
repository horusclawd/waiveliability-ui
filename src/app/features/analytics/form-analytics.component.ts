import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

import { AnalyticsService, FormAnalytics } from '../analytics.service';
import { FormService } from '../forms/form.service';

type TagSeverity = 'warn' | 'success' | 'secondary' | 'info' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-form-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    TagModule,
    ProgressSpinnerModule,
    ButtonModule,
    NgxEchartsModule,
  ],
  template: `
    <div class="router-fade p-4">
      <div class="flex align-items-center gap-3 mb-4">
        <a routerLink="/admin/analytics" class="text-primary no-underline">
          <i class="pi pi-arrow-left"></i>
        </a>
        <h2 class="m-0 text-xl font-semibold">Form Analytics</h2>
      </div>

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
      } @else if (analytics()) {
        <!-- Form Name -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold m-0">{{ analytics()!.formName }}</h3>
          <span class="text-color-secondary text-sm">Form ID: {{ formId }}</span>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <p-card styleClass="stat-card">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon bg-primary-50 text-primary">
                <i class="pi pi-file text-2xl"></i>
              </div>
              <div>
                <div class="text-color-secondary text-sm">Total Submissions</div>
                <div class="text-2xl font-semibold">{{ analytics()!.totalSubmissions }}</div>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon bg-yellow-50 text-yellow-600">
                <i class="pi pi-clock text-2xl"></i>
              </div>
              <div>
                <div class="text-color-secondary text-sm">Pending</div>
                <div class="text-2xl font-semibold">{{ analytics()!.pendingCount }}</div>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon bg-green-50 text-green-600">
                <i class="pi pi-check-circle text-2xl"></i>
              </div>
              <div>
                <div class="text-color-secondary text-sm">Reviewed</div>
                <div class="text-2xl font-semibold">{{ analytics()!.reviewedCount }}</div>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon bg-gray-50 text-gray-600">
                <i class="pi pi-archive text-2xl"></i>
              </div>
              <div>
                <div class="text-color-secondary text-sm">Archived</div>
                <div class="text-2xl font-semibold">{{ analytics()!.archivedCount }}</div>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Submissions Trend -->
          <p-card header="Submission Trend">
            <div echarts [options]="trendChart()" class="chart-container"></div>
          </p-card>

          <!-- Status Breakdown -->
          <p-card header="Status Breakdown">
            <div echarts [options]="statusPieChart()" class="chart-container"></div>
          </p-card>
        </div>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .stat-card .p-card-body {
      padding: 1.25rem;
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-container {
      height: 300px;
      width: 100%;
    }
  `],
})
export class FormAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private formService = inject(FormService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  error = signal<string | null>(null);
  analytics = signal<FormAnalytics | null>(null);
  formId = '';

  trendChart = signal<EChartsOption>({});
  statusPieChart = signal<EChartsOption>({});

  ngOnInit() {
    this.formId = this.route.snapshot.paramMap.get('id') || '';
    if (this.formId) {
      this.loadData();
    }
  }

  private loadData() {
    this.loading.set(true);
    this.analyticsService.getFormAnalytics(this.formId).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.analytics.set(data);
        this.setupCharts(data);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.title ?? 'Failed to load form analytics');
      },
    });
  }

  private setupCharts(data: FormAnalytics) {
    // Line chart for submissions trend
    const trendDates = data.submissionsTrend.map((d) => d.date);
    const trendCounts = data.submissionsTrend.map((d) => d.count);

    this.trendChart.set({
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendDates,
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
      },
      series: [
        {
          name: 'Submissions',
          type: 'line',
          smooth: true,
          data: trendCounts,
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.1)',
          },
          lineStyle: {
            color: '#3b82f6',
            width: 2,
          },
          itemStyle: {
            color: '#3b82f6',
          },
        },
      ],
    });

    // Pie chart for status breakdown
    const statusData = data.statusBreakdown.map((s) => ({
      name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
      value: s.count,
    }));

    this.statusPieChart.set({
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'horizontal',
        bottom: 'bottom',
      },
      series: [
        {
          name: 'Status',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          data: statusData,
          color: ['#f59e0b', '#22c55e', '#6b7280'],
        },
      ],
    });
  }
}
