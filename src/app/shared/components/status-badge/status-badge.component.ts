import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FlightStatus } from '../../../core/models/flight.model';
import { STATUS_ICONS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  status = input.required<FlightStatus>();
  statusIcon = () => STATUS_ICONS[this.status()];
  badgeClass = () => `status-badge status-${this.status().toLowerCase()}`;
}
