import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Ticket, TicketComment, TicketPriority, TicketStatus } from '../models/ticket';

export interface TicketSearchParams {
  q?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
}

@Injectable({ providedIn: 'root' })
export class TicketsApi {
  private readonly http = inject(HttpClient);

  search(filters: TicketSearchParams): Observable<Ticket[]> {
    const params: Record<string, string> = {};
    const q = filters.q?.trim();
    if (q) params['q'] = q;
    if (filters.status) params['status'] = filters.status;
    if (filters.priority) params['priority'] = filters.priority;

    return this.http
      .get<any[]>('/api/tickets', { params })
      .pipe(map((list) => list.map((dto) => this.toTicket(dto))));
  }

  updateStatus(id: string, status: TicketStatus): Observable<any> {
    return this.http.patch(`/api/tickets/${id}`, { status });
  }

  addComment(id: string, body: string): Observable<TicketComment> {
    return this.http
      .post<unknown>(`/api/tickets/${id}/comments`, { body })
      .pipe(map((dto) => this.toComment(dto)));
  }

  // TODO: tipar el contrato del servidor
  toTicket(dto: any): Ticket {
    const comments = (dto.comments ?? [])
      .map((c: any) => this.toComment(c))
      .sort(
        (a: TicketComment, b: TicketComment) =>
          a.createdAt.getTime() - b.createdAt.getTime(),
      );

    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      requester: dto.requester,
      assignee: dto.assignee,
      createdAt: new Date(dto.created_at),
      closedAt: dto.closed_at ? new Date(dto.closed_at) : null,
      comments,
    };
  }

  toComment(dto: any): TicketComment {
    return {
      id: dto.id,
      author: dto.author,
      bodyHtml: dto.body_html ?? dto.bodyHtml ?? '',
      createdAt: new Date(dto.created_at ?? dto.createdAt),
    };
  }
}
