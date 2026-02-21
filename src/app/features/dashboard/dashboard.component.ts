import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

import { AnalyticsService, AnalyticsOverview, RecentSubmission } from '../analytics/analytics.service';

type TagSeverity = 'warn' | 'success' | 'secondary' | 'info' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    SkeletonModule,
    NgxEchartsModule,
  ],
  template: `
    <div class="router-fade p-4">
      <h2 class="mt-0 mb-4 text-xl font-semibold">Dashboard</h2>

      @if (loading()) {
        <!-- Skeleton Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          @for (i of [1, 2, 3, 4]; track i) {
            <p-card styleClass="stat-card">
              <div class="flex align-items-center gap-3">
                <p-skeleton shape="circle" size="3rem" />
                <div class="flex flex-column gap-1">
                  <p-skeleton width="6rem" styleClass="mb-2" />
                  <p-skeleton width="4rem" />
                </div>
              </div>
            </p-card>
          }
        </div>

        <!-- Skeleton Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <p-card header="Submissions (Last 30 Days)">
            <p-skeleton width="100%" height="300px" />
          </p-card>
          <p-card header="Submissions by Status">
            <p-skeleton width="100%" height="300px" />
          </p-card>
        </div>

        <!-- Skeleton Table -->
        <p-card header="Recent Submissions">
          <p-table styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Submitter</th>
                <th>Form</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body">
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <tr>
                  <td><p-skeleton width="10rem" /></td>
                  <td><p-skeleton width="8rem" /></td>
                  <td><p-skeleton width="5rem" /></td>
                  <td><p-skeleton width="8rem" /></td>
                </tr>
              }
            </ng-template>
          </p-table>
        </p-card>
      } @else if (error()) {
        <p-card>
          <div class="text-center p-4">
            <i class="pi pi-exclamation-triangle text-orange-500" style="font-size: 2rem"></i>
            <p class="mt-2 text-color-secondary">{{ error() }}</p>
          </div>
        </p-card>
      } @else if (overview()) {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <p-card styleClass="stat-card">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon bg-primary-50 text-primary">
                <i class="pi pi-file text-2xl"></i>
              </div>
              <div>
                <div class="text-color-secondary text-sm">Total Submissions</div>
                <div class="text-2xl font-semibold">{{ overview()!.totalSubmissions }}</div>
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
                <div class="text-2xl font-semibold">{{ overview()!.pendingCount }}</div>
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
                <div class="text-2xl font-semibold">{{ overview()!.reviewedCount }}</div>
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
                <div class="text-2xl font-semibold">{{ overview()!.archivedCount }}</div>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <!-- Submissions by Day Line Chart -->
          <p-card header="Submissions (Last 30 Days)">
            <div echarts [options]="submissionsTrendChart()" class="chart-container"></div>
          </p-card>

          <!-- Submissions by Status Bar Chart -->
          <p-card header="Submissions by Status">
            <div echarts [options]="statusChart()" class="chart-container"></div>
          </p-card>
        </div>

        <!-- Recent Submissions Table -->
        <p-card header="Recent Submissions">
          <p-table
            [value]="overview()!.recentSubmissions"
            styleClass="p-datatable-sm"
            [rowHover]="true"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Submitter</th>
                <th>Form</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-sub>
              <tr>
                <td>
                  <div class="font-semibold">{{ sub.submitterName }}</div>
                  <div class="text-sm text-color-secondary">{{ sub.submitterEmail ?? '—' }}</div>
                </td>
                <td>{{ sub.formName }}</td>
                <td>
                  <p-tag
                    [value]="sub.status | titlecase"
                    [severity]="statusSeverity(sub.status)"
                  />
                </td>
                <td class="text-sm">{{ sub.submittedAt | date:'medium' }}</td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="4" class="text-center text-color-secondary py-4">
                  No recent submissions
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
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
export class DashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  loading = signal(true);
  error = signal<string | null>(null);
  overview = this.analyticsService.overview;

  submissionsTrendChart = signal<EChartsOption>({});
  statusChart = signal<EChartsOption>({});

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.analyticsService.getOverview().subscribe({
      next: (data: AnalyticsOverview) => {
        this.loading.set(false);
        this.setupCharts(data);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set('Failed to load analytics data');
      },
    });
  }

  private setupCharts(data: AnalyticsOverview) {
    // Line chart for submissions by day
    const dailyData: { date: string; count: number }[] = data.submissionsByDay;
    const trendDates = dailyData.map((d: { date: string; count: number }) => d.date);
    const trendCounts = dailyData.map((d: { date: string; count: number }) => d.count);

    this.submissionsTrendChart.set({
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

    // Bar chart for submissions by status
    const statusData: { status: string; count: number }[] = data.submissionsByStatus;
    const statusLabels = statusData.map((s) => s.status.charAt(0).toUpperCase() + s.status.slice(1));
    const statusCounts = statusData.map((s) => s.count);

    this.statusChart.set({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: statusLabels,
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
      },
      series: [
        {
          name: 'Submissions',
          type: 'bar',
          data: statusCounts,
          itemStyle: {
            color: (params: any) => {
              const colors: Record<string, string> = {
                Pending: '#f59e0b',
                Reviewed: '#22c55e',
                Archived: '#6b7280',
              };
              return colors[statusLabels[params.dataIndex]] || '#3b82f6';
            },
          },
        },
      ],
    });
  }

  statusSeverity(status: RecentSubmission['status']): TagSeverity {
    switch (status) {
      case 'pending': return 'warn';
      case 'reviewed': return 'success';
      case 'archived': return 'secondary';
      default: return undefined;
    }
  }
}
