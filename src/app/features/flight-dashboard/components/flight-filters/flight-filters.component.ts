import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { FlightService } from '../../services/flight.service';
import { ALL_STATUSES } from '../../../../core/constants/app.constants';
import { FlightStatus } from '../../../../core/models/flight.model';

@Component({
  selector: 'app-flight-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatBadgeModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './flight-filters.component.html',
  styleUrl: './flight-filters.component.scss',
})
export class FlightFiltersComponent implements OnInit, OnDestroy {
  private fb            = inject(FormBuilder);
  private flightService = inject(FlightService);
  private destroy$      = new Subject<void>();

  readonly statuses: FlightStatus[] = ALL_STATUSES;
  readonly origins      = this.flightService.uniqueOrigins;
  readonly destinations = this.flightService.uniqueDestinations;

  filterForm = this.fb.group({
    search:      [''],
    status:      [null as FlightStatus | null],
    origin:      [null as string | null],
    destination: [null as string | null],
  });

  ngOnInit(): void {
    const { search, status, origin, destination } = this.filterForm.controls;

    combineLatest([
      search.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      status.valueChanges.pipe(startWith(null)),
      origin.valueChanges.pipe(startWith(null)),
      destination.valueChanges.pipe(startWith(null)),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([s, st, o, d]) => {
        this.flightService.setFilter({
          search:      s  ?? '',
          status:      (st as FlightStatus) ?? '',
          origin:      o  ?? '',
          destination: d  ?? '',
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', status: null, origin: null, destination: null });
    this.flightService.clearFilters();
  }

  activeFilterCount(): number {
    const v = this.filterForm.value;
    return [v.search, v.status, v.origin, v.destination].filter(Boolean).length;
  }
}
