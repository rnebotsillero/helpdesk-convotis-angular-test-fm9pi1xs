import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TicketsApi } from './tickets-api';

describe('TicketsApi mapping', () => {
  let api: TicketsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TicketsApi, provideHttpClient()],
    });
    api = TestBed.inject(TicketsApi);
  });

  it('mapea snake_case del servidor a Ticket de dominio', () => {
    const ticket = api.toTicket({
      id: 'T-1',
      title: 'Título',
      description: 'Desc',
      status: 'open',
      priority: 'critical',
      requester: 'Ana',
      assignee: null,
      created_at: '2026-03-04T09:00:00.000Z',
      closed_at: null,
      comments: [],
    });

    expect(ticket.id).toBe('T-1');
    expect(ticket.createdAt).toEqual(new Date('2026-03-04T09:00:00.000Z'));
    expect(ticket.closedAt).toBeNull();
    expect(ticket.comments).toEqual([]);
  });

  it('parsea closed_at como Date', () => {
    const ticket = api.toTicket({
      id: 'T-2',
      title: 'Cerrado',
      description: '',
      status: 'closed',
      priority: 'low',
      requester: 'Ana',
      assignee: 'Pedro',
      created_at: '2026-03-01T09:00:00.000Z',
      closed_at: '2026-03-02T09:00:00.000Z',
      comments: [],
    });

    expect(ticket.closedAt).toEqual(new Date('2026-03-02T09:00:00.000Z'));
  });

  it('ordena comentarios de más antiguo a más reciente', () => {
    const ticket = api.toTicket({
      id: 'T-3',
      title: 'Con comentarios',
      description: '',
      status: 'open',
      priority: 'medium',
      requester: 'Ana',
      assignee: null,
      created_at: '2026-03-04T09:00:00.000Z',
      closed_at: null,
      comments: [
        {
          id: 'C-2',
          author: 'B',
          body_html: 'segundo',
          created_at: '2026-03-04T11:00:00.000Z',
        },
        {
          id: 'C-1',
          author: 'A',
          body_html: 'primero',
          created_at: '2026-03-04T10:00:00.000Z',
        },
      ],
    });

    expect(ticket.comments.map((c) => c.id)).toEqual(['C-1', 'C-2']);
    expect(ticket.comments[0].bodyHtml).toBe('primero');
  });

  it('mapea un comentario suelto desde el POST', () => {
    const comment = api.toComment({
      id: 'C-9',
      author: 'Tú',
      body_html: 'hola',
      created_at: '2026-03-04T12:00:00.000Z',
    });

    expect(comment).toEqual({
      id: 'C-9',
      author: 'Tú',
      bodyHtml: 'hola',
      createdAt: new Date('2026-03-04T12:00:00.000Z'),
    });
  });
});
