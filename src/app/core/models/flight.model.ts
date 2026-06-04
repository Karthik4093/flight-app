export type FlightStatus = 'Scheduled' | 'Boarding' | 'Active' | 'Delayed' | 'Arrived' | 'Cancelled';

export interface Airport {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Flight {
  id: string;
  flightNumber: string;
  callsign: string;
  aircraftType: string;
  origin: string;
  destination: string;
  originAirport: Airport;
  destinationAirport: Airport;
  currentPosition: { lat: number; lng: number };
  status: FlightStatus;
  estimatedDeparture: string;
  estimatedArrival: string;
  altitude?: number;
  speed?: number;
  heading?: number;
  gate?: string;
  terminal?: string;
  airline?: string;
  delay?: number;
}

export interface KpiData {
  total: number;
  active: number;
  delayed: number;
  arrived: number;
  scheduled: number;
  boarding: number;
  cancelled: number;
}

export interface FilterState {
  search: string;
  status: FlightStatus | '';
  origin: string;
  destination: string;
}

export interface MarkerColor {
  color: string;
  icon: string;
}
