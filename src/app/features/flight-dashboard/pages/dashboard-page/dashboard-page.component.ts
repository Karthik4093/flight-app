import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FlightService } from '../../services/flight.service';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { FlightMapComponent } from '../../components/flight-map/flight-map.component';
import { FlightListComponent } from '../../components/flight-list/flight-list.component';
import { FlightFiltersComponent } from '../../components/flight-filters/flight-filters.component';
import { FlightDetailsComponent } from '../../components/flight-details/flight-details.component';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    MatCardModule,
    KpiCardComponent,
    FlightMapComponent,
    FlightListComponent,
    FlightFiltersComponent,
    FlightDetailsComponent,
    HeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  protected fs = inject(FlightService);
  readonly kpis = this.fs.filteredKpis;
}
