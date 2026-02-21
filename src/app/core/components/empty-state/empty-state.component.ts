import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

export type EmptyStateIcon = 'inbox' | 'file' | 'users' | 'mail' | 'search' | 'shield';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="empty-state-container flex flex-column align-items-center justify-content-center p-6 text-center">
      <div class="empty-state-icon bg-primary-50 border-circle mb-4">
        <i [class]="getIconClass()" class="text-primary" style="font-size: 3rem"></i>
      </div>

      <h3 class="text-xl font-semibold m-0 mb-2">{{ title }}</h3>

      @if (message) {
        <p class="text-color-secondary m-0 mb-4 max-w-25rem">{{ message }}</p>
      }

      @if (actionLabel && actionCallback) {
        <p-button
          [label]="actionLabel"
          [icon]="actionIcon"
          (onClick)="actionCallback()"
        />
      }

      @if (secondaryActionLabel && secondaryActionCallback) {
        <p-button
          [label]="secondaryActionLabel"
          [icon]="secondaryActionIcon"
          [severity]="'secondary'"
          [outlined]="true"
          styleClass="ml-2"
          (onClick)="secondaryActionCallback()"
        />
      }
    </div>
  `,
  styles: [`
    .empty-state-container {
      min-height: 300px;
    }

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
export class EmptyStateComponent {
  @Input() icon: EmptyStateIcon = 'inbox';
  @Input() title = 'No items found';
  @Input() message?: string;
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Input() actionCallback?: () => void;
  @Input() secondaryActionLabel?: string;
  @Input() secondaryActionIcon?: string;
  @Input() secondaryActionCallback?: () => void;

  getIconClass(): string {
    const icons: Record<EmptyStateIcon, string> = {
      inbox: 'pi pi-inbox',
      file: 'pi pi-file',
      users: 'pi pi-users',
      mail: 'pi pi-envelope',
      search: 'pi pi-search',
      shield: 'pi pi-shield',
    };
    return icons[this.icon] || 'pi pi-inbox';
  }
}
