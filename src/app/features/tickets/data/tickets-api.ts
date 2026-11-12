import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Ticket, TicketPriority, TicketStatus } from '../models/ticket';

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

  addComment(id: string, body: string): Observable<any> {
    return this.http.post(`/api/tickets/${id}/comments`, { body });
  }

  // TODO: tipar el contrato del servidor
  toTicket(dto: any): Ticket {
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
      comments: (dto.comments ?? []).map((c: any) => ({
        id: c.id,
        author: c.author,
        bodyHtml: c.body_html,
        createdAt: new Date(c.created_at),
      })),
    };
  }
}
