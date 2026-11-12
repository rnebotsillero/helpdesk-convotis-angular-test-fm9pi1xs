import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { TicketsApi } from '../../data/tickets-api';
import {
  isTicketPriority,
  isTicketStatus,
  parseTicketSearchParams,
} from '../../domain/ticket-filters';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../../models/ticket';
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
  private readonly route = inject(ActivatedRoute);
  private readonly searchInput = new Subject<string>();

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly statuses = Object.keys(STATUS_LABELS) as TicketStatus[];
  protected readonly priorities = Object.keys(PRIORITY_LABELS) as TicketPriority[];

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly searchFromUrl = computed(() => this.queryParams().get('q') ?? '');
  /** Borrador local para no perder teclas mientras el debounce escribe en la URL. */
  protected readonly searchDraft = signal(this.searchFromUrl());
  protected readonly statusFilter = computed(() => {
    const value = this.queryParams().get('status');
    return isTicketStatus(value) ? value : 'all';
  });
  protected readonly priorityFilter = computed(() => {
    const value = this.queryParams().get('priority');
    return isTicketPriority(value) ? value : 'all';
  });

  protected readonly tickets = signal<Ticket[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    // Atrás/adelante / reload: alinear el input con la URL
    effect(() => {
      this.searchDraft.set(this.searchFromUrl());
    });

    // Texto → debounce → URL (fuente de verdad)
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.patchQuery({ q: q.trim() || null }));

    // URL → API (reload y atrás/adelante incluidos)
    this.route.queryParamMap
      .pipe(
        map((params) => parseTicketSearchParams(params)),
        distinctUntilChanged(
          (a, b) => a.q === b.q && a.status === b.status && a.priority === b.priority,
        ),
        tap(() => {
          this.tickets.set([]);
          this.loading.set(true);
          this.errorMessage.set('');
        }),
        switchMap((filters) =>
          this.api.search(filters).pipe(
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
    this.searchDraft.set(term);
    this.searchInput.next(term);
  }

  protected onStatusChange(value: string): void {
    this.patchQuery({ status: value === 'all' ? null : value });
  }

  protected onPriorityChange(value: string): void {
    this.patchQuery({ priority: value === 'all' ? null : value });
  }

  protected open(ticket: Ticket): void {
    void this.router.navigate(['/tickets', ticket.id], {
      queryParamsHandling: 'preserve',
    });
  }

  private patchQuery(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
