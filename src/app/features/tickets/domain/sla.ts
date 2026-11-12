import { Ticket, TicketPriority } from '../models/ticket';

export type SlaState = 'ok' | 'at_risk' | 'breached';

/** Horas laborables de SLA por prioridad (BUSINESS_RULES.md). */
export const SLA_HOURS: Record<TicketPriority, number> = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 72,
};

const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 18;

/**
 * Horas laborables entre dos instantes (lun–vie 09:00–18:00, hora local).
 * Fuera de ese horario el reloj del SLA está parado.
 */
export function businessHoursBetween(from: Date, to: Date): number {
  if (to.getTime() <= from.getTime()) {
    return 0;
  }

  const rangeStart = from.getTime();
  const rangeEnd = to.getTime();
  let ms = 0;

  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const lastDay = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  while (day.getTime() <= lastDay.getTime()) {
    const weekday = day.getDay();
    if (weekday !== 0 && weekday !== 6) {
      const windowStart = new Date(day);
      windowStart.setHours(BUSINESS_START_HOUR, 0, 0, 0);
      const windowEnd = new Date(day);
      windowEnd.setHours(BUSINESS_END_HOUR, 0, 0, 0);

      const overlapStart = Math.max(windowStart.getTime(), rangeStart);
      const overlapEnd = Math.min(windowEnd.getTime(), rangeEnd);
      if (overlapEnd > overlapStart) {
        ms += overlapEnd - overlapStart;
      }
    }
    day.setDate(day.getDate() + 1);
  }

  return ms / 3_600_000;
}

/**
 * Estado de SLA según BUSINESS_RULES.md.
 * Los tickets cerrados no tienen indicador (null).
 */
export function slaState(
  ticket: Pick<Ticket, 'priority' | 'createdAt'> & Partial<Pick<Ticket, 'status'>>,
  now: Date = new Date(),
): SlaState | null {
  if (ticket.status === 'closed') {
    return null;
  }

  const elapsedHours = businessHoursBetween(ticket.createdAt, now);
  const limit = SLA_HOURS[ticket.priority];

  if (elapsedHours > limit) {
    return 'breached';
  }
  if (elapsedHours >= limit * 0.75) {
    return 'at_risk';
  }
  return 'ok';
}
