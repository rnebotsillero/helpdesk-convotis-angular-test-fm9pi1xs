import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EMPTY, catchError, distinctUntilChanged, map, switchMap, timer } from 'rxjs';
import { TicketsApi } from '../../data/tickets-api';
import { STATUS_LABELS, Ticket, TicketStatus } from '../../models/ticket';
import { slaState } from '../../domain/sla';

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
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statuses = Object.keys(STATUS_LABELS) as TicketStatus[];

  private readonly ticketId = signal(this.route.snapshot.paramMap.get('id')!);

  protected readonly ticket = signal<Ticket | undefined>(undefined);
  protected readonly notFound = signal(false);
  protected readonly canEdit = computed(() => !!this.ticket());
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
    const ticket = this.ticket()!;
    ticket.status = status;
    this.api.updateStatus(ticket.id, status).subscribe();
  }

  // Necesario para que se muestren el formato y las imágenes de los comentarios
  protected html(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }

  private siblingId(offset: number): string {
    const n = Number(this.ticketId().replace('T-', '')) + offset;
    return `T-${n}`;
  }
}
