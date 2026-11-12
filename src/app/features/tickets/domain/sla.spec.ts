import { SLA_HOURS, businessHoursBetween, slaState } from './sla';

describe('SLA_HOURS', () => {
  it('coincide con BUSINESS_RULES.md', () => {
    expect(SLA_HOURS).toEqual({
      critical: 4,
      high: 8,
      medium: 24,
      low: 72,
    });
  });
});

describe('businessHoursBetween', () => {
  it('cuenta solo el tramo dentro de 09:00–18:00 en día laborable', () => {
    // miércoles
    const from = new Date(2026, 2, 4, 8, 0, 0);
    const to = new Date(2026, 2, 4, 11, 0, 0);

    expect(businessHoursBetween(from, to)).toBe(2); // 09:00–11:00
  });

  it('cuenta un día laborable completo como 9 horas', () => {
    const from = new Date(2026, 2, 4, 9, 0, 0);
    const to = new Date(2026, 2, 4, 18, 0, 0);

    expect(businessHoursBetween(from, to)).toBe(9);
  });

  it('no avanza el reloj fuera de horario laborable el mismo día', () => {
    const from = new Date(2026, 2, 4, 18, 0, 0);
    const to = new Date(2026, 2, 4, 22, 0, 0);

    expect(businessHoursBetween(from, to)).toBe(0);
  });

  it('no avanza el reloj en fin de semana', () => {
    const saturday = new Date(2026, 2, 7, 10, 0, 0);
    const sunday = new Date(2026, 2, 8, 17, 0, 0);

    expect(businessHoursBetween(saturday, sunday)).toBe(0);
  });

  it('suma horas laborables saltando el fin de semana', () => {
    // viernes 16:00 → lunes 11:00 = 2h vie + 2h lun
    const friday = new Date(2026, 2, 6, 16, 0, 0);
    const monday = new Date(2026, 2, 9, 11, 0, 0);

    expect(businessHoursBetween(friday, monday)).toBe(4);
  });

  it('devuelve 0 si el fin es anterior o igual al inicio', () => {
    const t = new Date(2026, 2, 4, 12, 0, 0);
    expect(businessHoursBetween(t, t)).toBe(0);
    expect(businessHoursBetween(t, new Date(2026, 2, 4, 11, 0, 0))).toBe(0);
  });
});

describe('slaState', () => {
  const wednesdayNine = new Date(2026, 2, 4, 9, 0, 0);

  it('devuelve "ok" por debajo del 75 % del SLA', () => {
    // medium 24h → 0.5h << 75%
    const now = new Date(2026, 2, 4, 10, 0, 0);
    const ticket = {
      priority: 'medium' as const,
      createdAt: new Date(2026, 2, 4, 9, 30, 0),
      status: 'open' as const,
    };

    expect(slaState(ticket, now)).toBe('ok');
  });

  it('marca at_risk al consumir exactamente el 75 %', () => {
    // high = 8h → 75% = 6h (09:00 → 15:00)
    const atRiskPoint = new Date(2026, 2, 4, 15, 0, 0);

    expect(
      slaState({ priority: 'high', createdAt: wednesdayNine, status: 'open' }, atRiskPoint),
    ).toBe('at_risk');
  });

  it('sigue at_risk por debajo del límite y breached al superarlo', () => {
    // critical = 4h → 75% = 3h
    const almostLimit = new Date(2026, 2, 4, 13, 0, 0); // 4h exactas: aún no superado
    const justOver = new Date(2026, 2, 4, 13, 0, 1); // > 4h

    expect(
      slaState({ priority: 'critical', createdAt: wednesdayNine, status: 'open' }, almostLimit),
    ).toBe('at_risk');
    expect(
      slaState({ priority: 'critical', createdAt: wednesdayNine, status: 'open' }, justOver),
    ).toBe('breached');
  });

  it('aplica el límite correct de cada prioridad', () => {
    // Tras 5h laborables (09→14): critical breached, high aún ok
    const afterFive = new Date(2026, 2, 4, 14, 0, 0);

    expect(
      slaState({ priority: 'critical', createdAt: wednesdayNine, status: 'open' }, afterFive),
    ).toBe('breached');
    expect(
      slaState({ priority: 'high', createdAt: wednesdayNine, status: 'open' }, afterFive),
    ).toBe('ok');
  });

  it('respeta medium (24h) y low (72h) en horas laborables', () => {
    // 3 días laborables completos = 27h (mié+jue+vie 09–18)
    const afterThreeFullDays = new Date(2026, 2, 6, 18, 0, 0); // viernes 18:00 desde mié 09:00

    expect(
      slaState(
        { priority: 'medium', createdAt: wednesdayNine, status: 'in_progress' },
        afterThreeFullDays,
      ),
    ).toBe('breached'); // 27 > 24

    expect(
      slaState(
        { priority: 'low', createdAt: wednesdayNine, status: 'waiting_customer' },
        afterThreeFullDays,
      ),
    ).toBe('ok'); // 27 < 72*0.75
  });

  it('no muestra indicador para tickets cerrados', () => {
    const now = new Date(2026, 2, 4, 12, 0, 0);
    expect(
      slaState(
        {
          priority: 'critical',
          createdAt: new Date(2026, 2, 1, 9, 0, 0),
          status: 'closed',
        },
        now,
      ),
    ).toBeNull();
  });

  it('el reloj parado en fin de semana evita un false breached', () => {
    // critical 4h: viernes 15:00 → lunes 10:00 = 3h vie + 1h lun = 4h → at_risk (no breached)
    const friday = new Date(2026, 2, 6, 15, 0, 0);
    const monday = new Date(2026, 2, 9, 10, 0, 0);

    expect(
      slaState({ priority: 'critical', createdAt: friday, status: 'open' }, monday),
    ).toBe('at_risk');
  });
});
