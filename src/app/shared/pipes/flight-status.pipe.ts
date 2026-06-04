import { Pipe, PipeTransform } from '@angular/core';
import { FlightStatus } from '../../core/models/flight.model';

@Pipe({ name: 'flightStatusLabel', standalone: true, pure: true })
export class FlightStatusLabelPipe implements PipeTransform {
  transform(status: FlightStatus): string {
    const labels: Record<FlightStatus, string> = {
      Active: 'In Flight',
      Boarding: 'Now Boarding',
      Scheduled: 'Scheduled',
      Delayed: 'Delayed',
      Arrived: 'Landed',
      Cancelled: 'Cancelled',
    };
    return labels[status] ?? status;
  }
}
