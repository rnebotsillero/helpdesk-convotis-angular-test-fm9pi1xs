import { allowedTransitions, canReopen } from './status-transitions';

describe('allowedTransitions', () => {
  it('desde open solo permite in_progress y closed', () => {
    expect(allowedTransitions({ status: 'open', closedAt: null })).toEqual([
      'in_progress',
      'closed',
    ]);
  });

  it('desde in_progress solo permite waiting_customer y closed', () => {
    expect(allowedTransitions({ status: 'in_progress', closedAt: null })).toEqual([
      'waiting_customer',
      'closed',
    ]);
  });

  it('desde waiting_customer solo permite in_progress y closed', () => {
    expect(allowedTransitions({ status: 'waiting_customer', closedAt: null })).toEqual([
      'in_progress',
      'closed',
    ]);
  });

  it('permite reabrir un closed si se cerró hace 7 días o menos', () => {
    const now = new Date(2026, 2, 10, 12, 0, 0);
    const closedAt = new Date(2026, 2, 5, 12, 0, 0); // 5 días

    expect(allowedTransitions({ status: 'closed', closedAt }, now)).toEqual(['open']);
  });

  it('permite reabrir exactamente a los 7 días', () => {
    const now = new Date(2026, 2, 12, 12, 0, 0);
    const closedAt = new Date(2026, 2, 5, 12, 0, 0); // exactamente 7 días

    expect(allowedTransitions({ status: 'closed', closedAt }, now)).toEqual(['open']);
  });

  it('no permite reabrir si el cierre tiene más de 7 días', () => {
    const now = new Date(2026, 2, 20, 12, 0, 0);
    const closedAt = new Date(2026, 2, 5, 12, 0, 0);

    expect(allowedTransitions({ status: 'closed', closedAt }, now)).toEqual([]);
  });

  it('no permite reabrir si closedAt es null', () => {
    expect(allowedTransitions({ status: 'closed', closedAt: null })).toEqual([]);
  });

  it('desde closed nunca ofrece transiciones distintas de open', () => {
    const now = new Date(2026, 2, 6, 12, 0, 0);
    const closedAt = new Date(2026, 2, 5, 12, 0, 0);
    const targets = allowedTransitions({ status: 'closed', closedAt }, now);

    expect(targets.every((s) => s === 'open')).toBe(true);
  });
});

describe('canReopen', () => {
  it('es false sin fecha de cierre o con fecha inválida', () => {
    expect(canReopen(null)).toBe(false);
    expect(canReopen(new Date('invalid'))).toBe(false);
  });
});
