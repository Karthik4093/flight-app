import { FlightStatus } from '../models/flight.model';

export const STATUS_COLORS: Record<FlightStatus, string> = {
  Active: '#2E7D32',
  Boarding: '#1565C0',
  Scheduled: '#616161',
  Delayed: '#F9A825',
  Arrived: '#42A5F5',
  Cancelled: '#C62828',
};

export const STATUS_ICONS: Record<FlightStatus, string> = {
  Active: 'flight',
  Boarding: 'airline_seat_recline_normal',
  Scheduled: 'schedule',
  Delayed: 'warning',
  Arrived: 'flight_land',
  Cancelled: 'cancel',
};

export const STATUS_BG_COLORS: Record<FlightStatus, string> = {
  Active: '#E8F5E9',
  Boarding: '#E3F2FD',
  Scheduled: '#F5F5F5',
  Delayed: '#FFFDE7',
  Arrived: '#E3F2FD',
  Cancelled: '#FFEBEE',
};

export const MAP_CONFIG = {
  defaultCenter: [20, 0] as [number, number],
  defaultZoom: 2,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

export const FILTER_DEBOUNCE_MS = 300;

export const ALL_STATUSES: FlightStatus[] = [
  'Scheduled',
  'Boarding',
  'Active',
  'Delayed',
  'Arrived',
  'Cancelled',
];
