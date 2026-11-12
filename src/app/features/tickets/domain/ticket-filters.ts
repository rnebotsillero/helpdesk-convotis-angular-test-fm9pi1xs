import { TicketSearchParams } from '../data/tickets-api';
import { PRIORITY_LABELS, STATUS_LABELS, TicketPriority, TicketStatus } from '../models/ticket';

type ParamReader = { get(name: string): string | null };

export function isTicketStatus(value: string | null): value is TicketStatus {
  return !!value && value in STATUS_LABELS;
}

export function isTicketPriority(value: string | null): value is TicketPriority {
  return !!value && value in PRIORITY_LABELS;
}

/** Interpreta query params del listado (feat A). */
export function parseTicketSearchParams(params: ParamReader): TicketSearchParams {
  const status = params.get('status');
  const priority = params.get('priority');
  return {
    q: params.get('q') ?? '',
    status: isTicketStatus(status) ? status : undefined,
    priority: isTicketPriority(priority) ? priority : undefined,
  };
}

/** Query params limpios para el router (null = eliminar de la URL). */
export function toQueryParams(filters: {
  q?: string | null;
  status?: string | null;
  priority?: string | null;
}): Record<string, string | null> {
  return {
    q: filters.q?.trim() ? filters.q.trim() : null,
    status: filters.status && filters.status !== 'all' ? filters.status : null,
    priority: filters.priority && filters.priority !== 'all' ? filters.priority : null,
  };
}
