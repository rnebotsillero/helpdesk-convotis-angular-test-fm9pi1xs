import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  merge,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { TicketsApi } from '../../data/tickets-api';
import { STATUS_LABELS, Ticket, TicketStatus } from '../../models/ticket';
import { TicketRow } from '../../components/ticket-row/ticket-row';

@Component({
  selector: 'app-ticket-list',
  imports: [FormsModule, TicketRow],
  templateUrl: './ticket-list.html',
  styleUrl: './ticket-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketList {
  private readonly api = inject(TicketsApi);
  private readonly router = inject(Router);
  private readonly searchInput = new Subject<string>();

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statuses = Object.keys(STATUS_LABELS) as TicketStatus[];

  protected readonly tickets = signal<Ticket[]>([]);
  protected readonly filtered = signal<Ticket[]>([]);
  protected readonly statusFilter = signal<TicketStatus | 'all'>('all');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected search = '';

  constructor() {
    effect(() => {
      const status = this.statusFilter();
      this.filtered.set(this.tickets().filter((t) => status === 'all' || t.status === status));
    });

    // Carga inicial inmediata; teclas con debounce. switchMap cancela la petición anterior.
    merge(of(this.search), this.searchInput.pipe(debounceTime(300)))
      .pipe(
        distinctUntilChanged(),
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set('');
        }),
        switchMap((term) =>
          this.api.search(term).pipe(
            catchError(() => {
              this.tickets.set([]);
              this.errorMessage.set('No se han podido cargar los tickets.');
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((tickets) => {
        this.tickets.set(tickets);
        this.loading.set(false);
      });
  }

  protected onSearch(term: string): void {
    this.search = term;
    this.searchInput.next(term);
  }

  protected open(ticket: Ticket): void {
    this.router.navigate(['/tickets', ticket.id]);
  }
}
