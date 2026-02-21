import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly base = `${environment.apiBaseUrl}/admin/team`;

  private readonly _members = signal<TeamMember[]>([]);
  private readonly _invites = signal<TeamInvite[]>([]);

  readonly members = this._members.asReadonly();
  readonly invites = this._invites.asReadonly();

  constructor(private http: HttpClient) {}

  getTeamMembers(): Observable<TeamMember[]> {
    return this.http
      .get<TeamMember[]>(this.base, { withCredentials: true })
      .pipe(tap((members) => this._members.set(members)));
  }

  inviteMember(email: string, role: 'admin' | 'editor' | 'viewer'): Observable<TeamInvite> {
    return this.http
      .post<TeamInvite>(`${this.base}/invite`, { email, role }, { withCredentials: true })
      .pipe(
        tap((invite) => {
          this._invites.update((invites) => [...invites, invite]);
        })
      );
  }

  getPendingInvites(): Observable<TeamInvite[]> {
    return this.http
      .get<TeamInvite[]>(`${this.base}/invites`, { withCredentials: true })
      .pipe(tap((invites) => this._invites.set(invites)));
  }

  cancelInvite(inviteId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/invites/${inviteId}`, { withCredentials: true })
      .pipe(
        tap(() => {
          this._invites.update((invites) => invites.filter((i) => i.id !== inviteId));
        })
      );
  }

  updateMemberRole(userId: string, role: 'admin' | 'editor' | 'viewer'): Observable<TeamMember> {
    return this.http
      .patch<TeamMember>(`${this.base}/${userId}`, { role }, { withCredentials: true })
      .pipe(
        tap((member) => {
          this._members.update((members) =>
            members.map((m) => (m.userId === userId ? member : m))
          );
        })
      );
  }

  removeMember(userId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${userId}`, { withCredentials: true })
      .pipe(
        tap(() => {
          this._members.update((members) => members.filter((m) => m.userId !== userId));
        })
      );
  }
}
