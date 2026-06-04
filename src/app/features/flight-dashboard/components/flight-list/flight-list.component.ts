import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { Flight } from '../../../../core/models/flight.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { FlightService } from '../../services/flight.service';

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    StatusBadgeComponent,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './flight-list.component.html',
  styleUrl: './flight-list.component.scss',
})
export class FlightListComponent {
  flights   = input.required<Flight[]>();
  isLoading = input<boolean>(false);

  private flightService = inject(FlightService);

  isSelected = (id: string) => this.flightService.selectedFlight()?.id === id;

  private currentSort = signal<Sort>({ active: '', direction: '' });

  readonly sortedFlights = computed<Flight[]>(() => {
    const list = [...this.flights()];
    const sort = this.currentSort();
    if (!sort.active || !sort.direction) return list;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      switch (sort.active) {
        case 'flightNumber': return a.flightNumber.localeCompare(b.flightNumber) * dir;
        case 'airline':      return (a.airline ?? '').localeCompare(b.airline ?? '') * dir;
        case 'status':       return a.status.localeCompare(b.status) * dir;
        default:             return 0;
      }
    });
  });

  readonly displayedColumns = ['flightNumber', 'airline', 'route', 'status', 'times', 'actions'];
  readonly pageSize  = signal(10);
  readonly pageIndex = signal(0);

  readonly pagedFlights = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sortedFlights().slice(start, start + this.pageSize());
  });

  constructor() {
    effect(() => {
      void this.flights();
      this.pageIndex.set(0);
    });
  }

  selectFlight(flight: Flight): void {
    this.flightService.selectFlight(flight);
  }

  onSort(sort: Sort): void {
    this.currentSort.set(sort);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }
}
