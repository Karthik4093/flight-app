import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map, shareReplay, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Flight, FilterState, FlightStatus, KpiData } from '../../../core/models/flight.model';

@Injectable({ providedIn: 'root' })
export class FlightService {
  private http = inject(HttpClient);

  private readonly filter$ = new BehaviorSubject<FilterState>({
    search: '',
    status: '',
    origin: '',
    destination: '',
  });

  readonly selectedFlight = signal<Flight | null>(null);
  readonly isLoading = signal(true);

  private readonly allFlights$ = this.http
    .get<Flight[]>('assets/mock-data/flights.json')
    .pipe(shareReplay(1));

  readonly allFlightsSignal = toSignal(this.allFlights$, { initialValue: [] });

  readonly filteredFlights$ = combineLatest([this.allFlights$, this.filter$.pipe(debounceTime(300), distinctUntilChanged())]).pipe(
    map(([flights, filter]) => this.applyFilters(flights, filter)),
    startWith([] as Flight[]),
    shareReplay(1)
  );

  readonly filteredFlightsSignal = toSignal(this.filteredFlights$, { initialValue: [] });

  readonly kpis = computed<KpiData>(() => {
    const flights = this.allFlightsSignal();
    return {
      total: flights.length,
      active: flights.filter((f) => f.status === 'Active').length,
      delayed: flights.filter((f) => f.status === 'Delayed').length,
      arrived: flights.filter((f) => f.status === 'Arrived').length,
      scheduled: flights.filter((f) => f.status === 'Scheduled').length,
      boarding: flights.filter((f) => f.status === 'Boarding').length,
      cancelled: flights.filter((f) => f.status === 'Cancelled').length,
    };
  });

  readonly filteredKpis = computed<KpiData>(() => {
    const flights = this.filteredFlightsSignal();
    return {
      total: flights.length,
      active: flights.filter((f) => f.status === 'Active').length,
      delayed: flights.filter((f) => f.status === 'Delayed').length,
      arrived: flights.filter((f) => f.status === 'Arrived').length,
      scheduled: flights.filter((f) => f.status === 'Scheduled').length,
      boarding: flights.filter((f) => f.status === 'Boarding').length,
      cancelled: flights.filter((f) => f.status === 'Cancelled').length,
    };
  });

  readonly uniqueOrigins = computed(() =>
    [...new Set(this.allFlightsSignal().map((f) => f.origin))].sort()
  );

  readonly uniqueDestinations = computed(() =>
    [...new Set(this.allFlightsSignal().map((f) => f.destination))].sort()
  );

  constructor() {
    this.allFlights$.subscribe(() => this.isLoading.set(false));
  }

  loadFlights(): void {
    this.isLoading.set(true);
  }

  setFilter(filter: Partial<FilterState>): void {
    this.filter$.next({ ...this.filter$.value, ...filter });
  }

  clearFilters(): void {
    this.filter$.next({ search: '', status: '', origin: '', destination: '' });
  }

  selectFlight(flight: Flight | null): void {
    this.selectedFlight.set(flight);
  }

  private applyFilters(flights: Flight[], filter: FilterState): Flight[] {
    return flights.filter((flight) => {
      const search = filter.search.toLowerCase().trim();
      if (search) {
        const matchesSearch =
          flight.flightNumber.toLowerCase().includes(search) ||
          flight.callsign.toLowerCase().includes(search) ||
          flight.origin.toLowerCase().includes(search) ||
          flight.destination.toLowerCase().includes(search) ||
          (flight.airline?.toLowerCase().includes(search) ?? false);
        if (!matchesSearch) return false;
      }
      if (filter.status && flight.status !== filter.status) return false;
      if (filter.origin && flight.origin !== filter.origin) return false;
      if (filter.destination && flight.destination !== filter.destination) return false;
      return true;
    });
  }

  getStatusColor(status: FlightStatus): string {
    const colors: Record<FlightStatus, string> = {
      Active: '#2E7D32',
      Boarding: '#1565C0',
      Scheduled: '#616161',
      Delayed: '#F9A825',
      Arrived: '#42A5F5',
      Cancelled: '#C62828',
    };
    return colors[status];
  }
}
