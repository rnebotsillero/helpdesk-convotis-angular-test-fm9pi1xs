import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { TicketsApi } from '../../data/tickets-api';
import { STATUS_LABELS, Ticket, TicketStatus } from '../../models/ticket';
import { slaState } from '../../domain/sla';
import { allowedTransitions } from '../../domain/status-transitions';

const GENERIC_STATUS_ERROR =
  'No se ha podido cambiar el estado. Inténtalo de nuevo.';

@Component({
  selector: 'app-ticket-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDetail {
  private readonly http = inject(HttpClient);
  private readonly api = inject(TicketsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statusLabels = STATUS_LABELS;

  private readonly ticketId = signal(this.route.snapshot.paramMap.get('id')!);

  protected readonly ticket = signal<Ticket | undefined>(undefined);
  protected readonly notFound = signal(false);
  protected readonly savingStatus = signal(false);
  protected readonly statusError = signal('');
  protected readonly canEdit = computed(() => !!this.ticket() && !this.savingStatus());
  protected readonly nextStatuses = computed(() => {
    const t = this.ticket();
    return t ? allowedTransitions(t) : [];
  });
  protected readonly sla = computed(() => {
    const t = this.ticket();
    return t ? slaState(t) : null;
  });

  protected readonly prevId = computed(() => this.siblingId(-1));
  protected readonly nextId = computed(() => this.siblingId(+1));

  constructor() {
    const id$ = this.route.paramMap.pipe(
      map((params) => params.get('id')!),
      distinctUntilChanged(),
    );

    id$.pipe(
      switchMap((id) => {
        this.ticketId.set(id);
        this.ticket.set(undefined);
        this.notFound.set(false);
        this.statusError.set('');
        this.savingStatus.set(false);

        return timer(0, 5000).pipe(
          switchMap(() =>
            this.http.get<unknown>(`/api/tickets/${id}`).pipe(
              catchError(() => {
                this.notFound.set(true);
                return EMPTY;
              }),
            ),
          ),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe((dto) => {
      this.notFound.set(false);
      this.ticket.set(this.api.toTicket(dto));
    });
  }

  protected changeStatus(status: TicketStatus): void {
    const current = this.ticket();
    if (
      !current ||
      this.savingStatus() ||
      status === current.status ||
      !allowedTransitions(current).includes(status)
    ) {
      return;
    }

    this.savingStatus.set(true);
    this.statusError.set('');

    this.api
      .updateStatus(current.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dto) => {
          this.ticket.set(this.api.toTicket(dto));
          this.savingStatus.set(false);
        },
        error: (err: unknown) => {
          this.statusError.set(this.serverErrorMessage(err, GENERIC_STATUS_ERROR));
          this.savingStatus.set(false);
        },
      });
  }

  /** El fake-api pone el mensaje en `statusText` (p. ej. 409 Conflict: …). */
  private serverErrorMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) {
      return fallback;
    }
    const text = err.statusText?.trim();
    if (!text || text === 'Unknown Error' || text === 'Http failure response') {
      return fallback;
    }
    return text;
  }

  private siblingId(offset: number): string {
    const n = Number(this.ticketId().replace('T-', '')) + offset;
    return `T-${n}`;
  }
}
