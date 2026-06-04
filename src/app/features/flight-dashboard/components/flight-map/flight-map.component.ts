import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Flight, FlightStatus } from '../../../../core/models/flight.model';
import { STATUS_COLORS } from '../../../../core/constants/app.constants';
import { FlightService } from '../../services/flight.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

type MarkerClusterGroupFactory = (opts?: object) => L.MarkerClusterGroup;

function getMarkerClusterGroup(): MarkerClusterGroupFactory | null {
  const fn = (L as unknown as Record<string, unknown>)['markerClusterGroup'];
  return typeof fn === 'function' ? (fn as MarkerClusterGroupFactory) : null;
}

@Component({
  selector: 'app-flight-map',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './flight-map.component.html',
  styleUrl: './flight-map.component.scss',
})
export class FlightMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  flights = input.required<Flight[]>();

  private flightService = inject(FlightService);
  private zone          = inject(NgZone);
  private platformId    = inject(PLATFORM_ID);

  private map!: L.Map;
  private markerLayer!: L.LayerGroup;
  private clusterGroup: L.MarkerClusterGroup | null = null;
  private airportLayer!: L.LayerGroup;
  private routeLayer!:   L.LayerGroup;
  private weatherLayer!: L.TileLayer;
  private resizeObserver!: ResizeObserver;

  private flightMarkers = new Map<string, L.Marker>();
  private hasFitInitialFlights = false;

  showAirports = signal(false);
  showWeather  = signal(false);

  readonly legendEntries: { status: FlightStatus; color: string }[] = [
    { status: 'Active',    color: STATUS_COLORS.Active },
    { status: 'Boarding',  color: STATUS_COLORS.Boarding },
    { status: 'Delayed',   color: STATUS_COLORS.Delayed },
    { status: 'Arrived',   color: STATUS_COLORS.Arrived },
    { status: 'Scheduled', color: STATUS_COLORS.Scheduled },
    { status: 'Cancelled', color: STATUS_COLORS.Cancelled },
  ];

  constructor() {
    effect(() => {
      const flights = this.flights();
      untracked(() => {
        if (this.map) this.renderFlights(flights);
      });
    });

    effect(() => {
      const sel = this.flightService.selectedFlight();
      untracked(() => {
        if (this.map && sel) this.focusFlight(sel);
      });
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.zone.runOutsideAngular(() => {
      try {
        this.initMap();
        this.renderFlights(this.flights());

        requestAnimationFrame(() => {
          this.map?.invalidateSize({ animate: false });
        });

        this.resizeObserver = new ResizeObserver(() => {
          this.map?.invalidateSize({ animate: false, pan: false });
        });
        this.resizeObserver.observe(this.mapEl.nativeElement);
      } catch (err) {
        console.error('[FlightMap] init failed:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.routeLayer?.clearLayers();
    this.clearFlightLayers();
    this.map?.off();
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
      crossOrigin: true,
    }).addTo(this.map);

    const clusterFactory = getMarkerClusterGroup();
    if (clusterFactory) {
      this.clusterGroup = clusterFactory({
        maxClusterRadius: 55,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        chunkedLoading: true,
        iconCreateFunction: (cluster: L.MarkerCluster) => this.buildClusterIcon(cluster),
      });
      this.markerLayer = this.clusterGroup;
    } else {
      console.warn('[FlightMap] marker clustering unavailable; rendering direct markers.');
      this.markerLayer = L.layerGroup();
    }
    this.map.addLayer(this.markerLayer);

    this.airportLayer = L.layerGroup();
    this.routeLayer   = L.layerGroup().addTo(this.map);

    this.weatherLayer = L.tileLayer(
      'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=demo',
      { opacity: 0.45, attribution: 'Weather © OpenWeatherMap' }
    );
  }

  private renderFlights(flights: Flight[]): void {
    if (!this.markerLayer) return;
    this.clearFlightLayers();
    this.flightMarkers.clear();

    for (const flight of flights) {
      const marker = this.buildFlightMarker(flight);
      this.flightMarkers.set(flight.id, marker);
      this.markerLayer.addLayer(marker);
    }

    if (this.showAirports()) this.renderAirports(flights);
    this.fitInitialFlights(flights);
  }

  private buildFlightMarker(flight: Flight): L.Marker {
    const color   = STATUS_COLORS[flight.status];
    const heading = flight.heading ?? 0;
    const moving  = flight.status === 'Active' || flight.status === 'Boarding';

    const icon = L.divIcon({
      className: '',
      html: `
        <div class="flight-marker${moving ? ' active' : ''}" style="--marker-color:${color}">
          <svg viewBox="0 0 24 24" width="26" height="26"
               style="transform:rotate(${heading}deg);display:block;">
            <path fill="${color}"
              d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2
                 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
          ${moving ? '<span class="pulse-ring"></span>' : ''}
        </div>`,
      iconSize:    [32, 32],
      iconAnchor:  [16, 16],
      popupAnchor: [0, -18],
    });

    const marker = L.marker(
      [flight.currentPosition.lat, flight.currentPosition.lng],
      { icon, title: flight.flightNumber }
    );

    marker.bindPopup(this.buildPopupHtml(flight), {
      maxWidth: 260,
      className: 'flight-popup',
      closeButton: true,
    });

    marker.on('click', () => {
      this.zone.run(() => this.flightService.selectFlight(flight));
    });

    return marker;
  }

  private buildClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
    const count = cluster.getChildCount();
    return L.divIcon({
      className: '',
      html: `
        <div style="
          width:40px;height:40px;border-radius:50%;
          background:var(--av-primary,#1565C0);
          color:#fff;display:flex;align-items:center;
          justify-content:center;font-weight:700;font-size:0.85rem;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          border:2px solid rgba(255,255,255,0.85);">
          ${count}
        </div>`,
      iconSize:   [40, 40],
      iconAnchor: [20, 20],
    });
  }

  private buildPopupHtml(flight: Flight): string {
    const color = STATUS_COLORS[flight.status];
    const dept  = new Date(flight.estimatedDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const arr   = new Date(flight.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="popup-content">
        <div class="popup-header" style="border-left:4px solid ${color}">
          <strong>${flight.flightNumber}</strong>
          <span class="popup-status" style="color:${color}">${flight.status}</span>
        </div>
        <div class="popup-route">
          <span class="popup-airport">
            <strong>${flight.originAirport.code}</strong>
            <small>${flight.origin}</small>
          </span>
          <span class="popup-arrow">→</span>
          <span class="popup-airport" style="text-align:right">
            <strong>${flight.destinationAirport.code}</strong>
            <small>${flight.destination}</small>
          </span>
        </div>
        <div class="popup-times">
          <span>🛫 ${dept}</span>
          <span>🛬 ${arr}</span>
        </div>
        ${flight.altitude ? `
          <div class="popup-data-row">
            <span>✈ ${flight.aircraftType}</span>
          </div>
          <div class="popup-data-row">
            <span>${flight.altitude.toLocaleString()} ft</span>
            <span>${flight.speed} kts</span>
          </div>` : ''}
      </div>`;
  }

  private focusFlight(flight: Flight): void {
    this.routeLayer.clearLayers();

    const origin  = L.latLng(flight.originAirport.lat, flight.originAirport.lng);
    const current = L.latLng(flight.currentPosition.lat, flight.currentPosition.lng);
    const dest    = L.latLng(flight.destinationAirport.lat, flight.destinationAirport.lng);

    const bounds = L.latLngBounds([origin, current, dest]);
    this.map.flyToBounds(bounds, {
      padding:  [60, 60],
      maxZoom:  8,
      animate:  true,
      duration: 1.0,
    });

    const routeLine = L.polyline([origin, current, dest], {
      color:     STATUS_COLORS[flight.status],
      weight:    2.5,
      opacity:   0.85,
      dashArray: '8 5',
      lineCap:   'round',
    });

    const originDot = L.circleMarker(origin, {
      radius:      7,
      color:       '#fff',
      fillColor:   STATUS_COLORS[flight.status],
      fillOpacity: 1,
      weight:      2,
    }).bindTooltip(
      `${flight.originAirport.code}`,
      { permanent: true, direction: 'top', className: 'airport-tooltip', offset: [0, -4] }
    );

    const destDot = L.circleMarker(dest, {
      radius:      7,
      color:       '#fff',
      fillColor:   '#0D47A1',
      fillOpacity: 1,
      weight:      2,
    }).bindTooltip(
      `${flight.destinationAirport.code}`,
      { permanent: true, direction: 'top', className: 'airport-tooltip', offset: [0, -4] }
    );

    this.routeLayer.addLayer(routeLine);
    this.routeLayer.addLayer(originDot);
    this.routeLayer.addLayer(destDot);

    const marker = this.flightMarkers.get(flight.id);
    if (marker) {
      setTimeout(() => {
        this.zone.runOutsideAngular(() => {
          if (this.clusterGroup) {
            this.clusterGroup.zoomToShowLayer(marker, () => {
              marker.openPopup();
            });
            return;
          }
          if (this.map.hasLayer(marker)) {
            marker.openPopup();
          }
        });
      }, 1100);
    }
  }

  private clearFlightLayers(): void {
    this.markerLayer?.clearLayers();
  }

  private fitInitialFlights(flights: Flight[]): void {
    if (this.hasFitInitialFlights || !flights.length || this.flightService.selectedFlight()) return;
    this.hasFitInitialFlights = true;

    const bounds = L.latLngBounds(
      flights.map((f) => [f.currentPosition.lat, f.currentPosition.lng] as L.LatLngTuple)
    );

    requestAnimationFrame(() => {
      this.map.invalidateSize({ animate: false });
      this.map.fitBounds(bounds, { padding: [48, 48], maxZoom: 3, animate: false });
    });
  }

  private renderAirports(flights: Flight[]): void {
    this.airportLayer.clearLayers();
    const seen = new Set<string>();

    for (const f of flights) {
      for (const ap of [f.originAirport, f.destinationAirport]) {
        if (seen.has(ap.code)) continue;
        seen.add(ap.code);

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:10px;height:10px;border-radius:50%;
            background:#1565C0;border:2px solid #fff;
            box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
          iconSize:   [10, 10],
          iconAnchor: [5, 5],
        });
        L.marker([ap.lat, ap.lng], { icon })
          .bindTooltip(`${ap.code} — ${ap.name}`, { direction: 'top', className: 'airport-tooltip' })
          .addTo(this.airportLayer);
      }
    }
  }

  fitAll(): void {
    const flights = this.flights();
    if (!flights.length) return;
    const bounds = L.latLngBounds(
      flights.map(f => [f.currentPosition.lat, f.currentPosition.lng] as L.LatLngTuple)
    );
    this.map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 6, animate: true });
  }

  toggleAirports(): void {
    this.showAirports.update(v => !v);
    if (this.showAirports()) {
      this.renderAirports(this.flights());
      this.airportLayer.addTo(this.map);
    } else {
      this.airportLayer.removeFrom(this.map);
    }
  }

  toggleWeather(): void {
    this.showWeather.update(v => !v);
    if (this.showWeather()) {
      this.weatherLayer.addTo(this.map);
    } else {
      this.weatherLayer.removeFrom(this.map);
    }
  }
}
