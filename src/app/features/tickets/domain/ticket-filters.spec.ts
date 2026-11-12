import { parseTicketSearchParams, toQueryParams } from './ticket-filters';

function params(record: Record<string, string | undefined>) {
  return {
    get(name: string): string | null {
      return record[name] ?? null;
    },
  };
}

describe('parseTicketSearchParams', () => {
  it('lee q, status y priority válidos', () => {
    expect(
      parseTicketSearchParams(
        params({ q: 'pago', status: 'open', priority: 'critical' }),
      ),
    ).toEqual({
      q: 'pago',
      status: 'open',
      priority: 'critical',
    });
  });

  it('ignora status y priority inválidos', () => {
    expect(
      parseTicketSearchParams(params({ q: 'x', status: 'nope', priority: 'nope' })),
    ).toEqual({
      q: 'x',
      status: undefined,
      priority: undefined,
    });
  });

  it('usa q vacío si no viene en la URL', () => {
    expect(parseTicketSearchParams(params({}))).toEqual({
      q: '',
      status: undefined,
      priority: undefined,
    });
  });
});

describe('toQueryParams', () => {
  it('omite vacíos y valores all', () => {
    expect(
      toQueryParams({ q: '  ', status: 'all', priority: 'all' }),
    ).toEqual({ q: null, status: null, priority: null });
  });

  it('serializa filtros activos', () => {
    expect(
      toQueryParams({ q: ' pago ', status: 'open', priority: 'high' }),
    ).toEqual({ q: 'pago', status: 'open', priority: 'high' });
  });
});
