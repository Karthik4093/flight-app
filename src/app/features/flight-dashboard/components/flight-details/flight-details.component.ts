import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Flight } from '../../../../core/models/flight.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { FlightService } from '../../services/flight.service';

@Component({
  selector: 'app-flight-details',
  standalone: true,
  imports: [
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './flight-details.component.html',
  styleUrl: './flight-details.component.scss',
})
export class FlightDetailsComponent {
  flight = input<Flight | null>(null);
  private flightService = inject(FlightService);
  close(): void { this.flightService.selectFlight(null); }
}
