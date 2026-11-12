import { Ticket, TicketStatus } from '../models/ticket';

const REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  open: ['in_progress', 'closed'],
  in_progress: ['waiting_customer', 'closed'],
  waiting_customer: ['in_progress', 'closed'],
  closed: ['open'],
};

/**
 * Transiciones de estado permitidas según BUSINESS_RULES.md.
 * Desde `closed` solo se puede reabrir a `open` si se cerró hace 7 días o menos.
 */
export function allowedTransitions(
  ticket: Pick<Ticket, 'status' | 'closedAt'>,
  now: Date = new Date(),
): TicketStatus[] {
  const targets = TRANSITIONS[ticket.status];
  if (ticket.status !== 'closed') {
    return [...targets];
  }

  if (!canReopen(ticket.closedAt, now)) {
    return [];
  }
  return [...targets];
}

export function canReopen(closedAt: Date | null, now: Date = new Date()): boolean {
  if (!closedAt) {
    return false;
  }
  const closedTime = closedAt instanceof Date ? closedAt.getTime() : new Date(closedAt).getTime();
  if (Number.isNaN(closedTime)) {
    return false;
  }
  return now.getTime() - closedTime <= REOPEN_WINDOW_MS;
}
