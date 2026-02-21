import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { TeamService, TeamMember, TeamInvite } from './team.service';
import { AuthService } from '../../../core/auth/auth.service';
import { EmptyStateComponent } from '../../../core/components/empty-state/empty-state.component';

@Component({
  selector: 'app-settings-team',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    TagModule,
    DialogModule,
    ToastModule,
    SkeletonModule,
    EmptyStateComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="router-fade">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="mt-0">Team Management</h2>
        @if (isAdmin()) {
          <p-button
            label="Invite Member"
            icon="pi pi-user-plus"
            (onClick)="showInviteDialog = true"
            ariaLabel="Invite new team member"
          />
        }
      </div>

      <!-- Team Members Table -->
      <p-card header="Team Members" class="mb-4">
        @if (loadingMembers()) {
          <p-table [tableStyle]="{ 'min-width': '50rem' }" styleClass="p-datatable-striped">
            <ng-template pTemplate="header">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                @if (isAdmin()) {
                  <th style="width: 8rem">Actions</th>
                }
              </tr>
            </ng-template>
            <ng-template pTemplate="body">
              @for (i of [1, 2, 3, 4]; track i) {
                <tr>
                  <td><p-skeleton width="10rem" /></td>
                  <td><p-skeleton width="14rem" /></td>
                  <td><p-skeleton width="5rem" /></td>
                  <td><p-skeleton width="6rem" /></td>
                  @if (isAdmin()) {
                    <td><p-skeleton width="4rem" /></td>
                  }
                </tr>
              }
            </ng-template>
          </p-table>
        } @else {
          <p-table
            [value]="members()"
            [tableStyle]="{ 'min-width': '50rem' }"
            styleClass="p-datatable-striped"
          >
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              @if (isAdmin()) {
                <th style="width: 8rem">Actions</th>
              }
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-member>
            <tr>
              <td>{{ member.name }}</td>
              <td>{{ member.email }}</td>
              <td>
                @if (isAdmin() && member.userId !== currentUserId()) {
                  <p-select
                    [options]="roleOptions"
                    [(ngModel)]="member.role"
                    (onChange)="onRoleChange(member.userId, $event.value)"
                    appendTo="body"
                    styleClass="w-full"
                  />
                } @else {
                  <p-tag
                    [value]="member.role"
                    [severity]="getRoleSeverity(member.role)"
                  />
                }
              </td>
              <td>{{ member.createdAt | date:'mediumDate' }}</td>
              @if (isAdmin()) {
                <td>
                  @if (member.userId !== currentUserId()) {
                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      (onClick)="confirmRemoveMember(member)"
                      pTooltip="Remove member"
                    />
                  }
                </td>
              }
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5">
                <app-empty-state
                  icon="users"
                  title="No team members"
                  message="Invite team members to collaborate on your forms."
                  actionLabel="Invite Member"
                  actionIcon="pi pi-user-plus"
                  [actionCallback]="() => showInviteDialog = true"
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
        }
      </p-card>

      <!-- Pending Invites -->
      @if (isAdmin() && !loadingMembers()) {
        @if (invites().length > 0) {
        <p-card header="Pending Invites">
          <p-table
            [value]="invites()"
            [tableStyle]="{ 'min-width': '50rem' }"
            styleClass="p-datatable-striped"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Invited By</th>
                <th>Invited At</th>
                <th>Expires</th>
                <th style="width: 6rem">Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-invite>
              <tr>
                <td>{{ invite.email }}</td>
                <td>
                  <p-tag
                    [value]="invite.role"
                    [severity]="getRoleSeverity(invite.role)"
                  />
                </td>
                <td>{{ invite.invitedBy }}</td>
                <td>{{ invite.invitedAt | date:'medium' }}</td>
                <td>{{ invite.expiresAt | date:'mediumDate' }}</td>
                <td>
                  <p-button
                    icon="pi pi-times"
                    severity="danger"
                    text
                    (onClick)="cancelInvite(invite)"
                    pTooltip="Cancel invite"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      }

      <!-- Invite Dialog -->
      <p-dialog
        header="Invite Team Member"
        [(visible)]="showInviteDialog"
        [modal]="true"
        [style]="{ width: '400px' }"
        [closable]="true"
      >
        <form [formGroup]="inviteForm" class="flex flex-column gap-3">
          <div class="flex flex-column gap-2">
            <label for="inviteEmail" class="font-medium">Email Address</label>
            <input
              pInputText
              id="inviteEmail"
              type="email"
              formControlName="email"
              placeholder="colleague@company.com"
              class="w-full"
            />
            @if (isFieldInvalid('email')) {
              <small class="p-error">Valid email is required.</small>
            }
          </div>

          <div class="flex flex-column gap-2">
            <label for="inviteRole" class="font-medium">Role</label>
            <p-select
              id="inviteRole"
              formControlName="role"
              [options]="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a role"
              class="w-full"
            />
          </div>
        </form>

        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            severity="secondary"
            (onClick)="showInviteDialog = false"
          />
          <p-button
            label="Send Invite"
            icon="pi pi-send"
            [loading]="sendingInvite()"
            [disabled]="inviteForm.invalid"
            (onClick)="sendInvite()"
          />
        </ng-template>
      </p-dialog>

      <!-- Remove Member Confirmation Dialog -->
      <p-dialog
        header="Remove Team Member"
        [(visible)]="showRemoveDialog"
        [modal]="true"
        [style]="{ width: '400px' }"
        [closable]="true"
      >
        <p>
          Are you sure you want to remove <strong>{{ memberToRemove()?.name }}</strong>
          from the team? They will lose access to this workspace.
        </p>

        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            severity="secondary"
            (onClick)="showRemoveDialog = false"
          />
          <p-button
            label="Remove"
            severity="danger"
            icon="pi pi-trash"
            [loading]="removingMember()"
            (onClick)="removeMember()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class TeamComponent implements OnInit {
  private fb = inject(FormBuilder);
  private teamService = inject(TeamService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  members = this.teamService.members;
  invites = this.teamService.invites;

  loadingMembers = signal(true);
  sendingInvite = signal(false);
  removingMember = signal(false);

  showInviteDialog = false;
  showRemoveDialog = false;
  memberToRemove = signal<TeamMember | null>(null);

  roleOptions = [
    { label: 'Admin', value: 'admin' as const },
    { label: 'Editor', value: 'editor' as const },
    { label: 'Viewer', value: 'viewer' as const },
  ];

  inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['editor' as 'admin' | 'editor' | 'viewer', Validators.required],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadingMembers.set(true);
    this.teamService.getTeamMembers().subscribe({
      next: () => this.loadingMembers.set(false),
      error: () => {
        this.loadingMembers.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load team members.',
        });
      },
    });

    if (this.isAdmin()) {
      this.teamService.getPendingInvites().subscribe({
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load pending invites.',
          });
        },
      });
    }
  }

  isAdmin(): boolean {
    return this.authService.user()?.role === 'admin';
  }

  currentUserId(): string | undefined {
    return this.authService.user()?.userId;
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'editor':
        return 'info';
      case 'viewer':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.inviteForm.get(field);
    return control ? control.invalid && control.touched : false;
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.sendingInvite.set(true);
    const { email, role } = this.inviteForm.getRawValue();

    this.teamService.inviteMember(email, role).subscribe({
      next: () => {
        this.sendingInvite.set(false);
        this.showInviteDialog = false;
        this.inviteForm.reset({ email: '', role: 'editor' });
        this.messageService.add({
          severity: 'success',
          summary: 'Invite Sent',
          detail: `Invitation sent to ${email}.`,
        });
      },
      error: () => {
        this.sendingInvite.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send invitation. Please try again.',
        });
      },
    });
  }

  cancelInvite(invite: TeamInvite): void {
    this.teamService.cancelInvite(invite.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Invite Cancelled',
          detail: `Invitation to ${invite.email} has been cancelled.`,
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to cancel invitation.',
        });
      },
    });
  }

  onRoleChange(userId: string, role: 'admin' | 'editor' | 'viewer'): void {
    this.teamService.updateMemberRole(userId, role).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Role Updated',
          detail: 'Team member role has been updated.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update role. Please try again.',
        });
        this.loadData(); // Reload to reset the dropdown
      },
    });
  }

  confirmRemoveMember(member: TeamMember): void {
    this.memberToRemove.set(member);
    this.showRemoveDialog = true;
  }

  removeMember(): void {
    const member = this.memberToRemove();
    if (!member) return;

    this.removingMember.set(true);
    this.teamService.removeMember(member.userId).subscribe({
      next: () => {
        this.removingMember.set(false);
        this.showRemoveDialog = false;
        this.memberToRemove.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Member Removed',
          detail: `${member.name} has been removed from the team.`,
        });
      },
      error: () => {
        this.removingMember.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove team member.',
        });
      },
    });
  }
}
