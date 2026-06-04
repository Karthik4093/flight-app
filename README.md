# AeroTrack — Flight Operations Dashboard

A production-ready **Flight Tracking & Operations Dashboard** built with **Angular 20**, Angular Material, Leaflet maps, and modern Angular patterns including Signals, standalone components, and the new control flow syntax.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
# → http://localhost:4200

# Production build
npm run build
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 20 (standalone components) |
| UI Library | Angular Material 20 |
| Maps | Leaflet + Leaflet.MarkerCluster |
| State | Angular Signals + RxJS BehaviorSubject |
| Forms | Reactive Forms |
| Routing | Angular Router (lazy-loaded) |
| Styling | SCSS + Angular Material theming |
| Responsiveness | CSS Grid, Flexbox, CDK BreakpointObserver |

---

## Features

### Core Dashboard
- **KPI Cards** — Total, Active, Boarding, Delayed, Arrived, Cancelled counts (live-filtered)
- **Interactive Leaflet Map** — 20 real international flight routes with clustered markers
- **Flight List** — Sortable Material Table with mobile card fallback and pagination
- **Smart Filters** — Search + Status + Origin + Destination with RxJS `combineLatest` / `debounceTime`
- **Flight Details Panel** — Rich info panel with route visualization, times, aircraft, gate

### Map Features
- Color-coded markers by flight status (Active=Green, Delayed=Orange, Arrived=Blue, etc.)
- Animated pulse ring on active/boarding flights
- Click marker or row → map flies to flight, opens popup, draws dashed route polyline
- Airport markers toggle (origin + destination dots)
- Weather overlay toggle (mock OpenWeatherMap tile layer)
- Marker clustering via `leaflet.markercluster`
- Fit-all-flights zoom control

### UX / A11y
- **Dark mode** toggle with `localStorage` persistence + `prefers-color-scheme` detection
- Skeleton loaders during data fetch
- Empty state messaging
- Full `aria-label`, `role`, `aria-live`, keyboard navigation on all interactive elements
- `OnPush` change detection on every component

---

## Project Architecture

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   └── flight.model.ts         ← Flight, Airport, KpiData, FilterState interfaces
│   │   ├── constants/
│   │   │   └── app.constants.ts        ← Status colors, icons, map config
│   │   └── services/
│   │       └── theme.service.ts        ← Dark/light mode signal
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── kpi-card/               ← Reusable KPI card with color + trend
│   │   │   ├── status-badge/           ← Colored status chip
│   │   │   └── skeleton-loader/        ← Shimmer placeholder
│   │   ├── pipes/
│   │   │   └── flight-status.pipe.ts   ← Human-readable status labels
│   │   └── directives/
│   │       └── highlight.directive.ts  ← Row hover highlight
│   │
│   ├── features/
│   │   └── flight-dashboard/
│   │       ├── pages/
│   │       │   └── dashboard-page/     ← Main layout orchestrator (lazy-loaded)
│   │       ├── components/
│   │       │   ├── header/             ← Toolbar + theme toggle + live badge
│   │       │   ├── flight-map/         ← Full Leaflet integration
│   │       │   ├── flight-list/        ← Material Table + mobile cards
│   │       │   ├── flight-filters/     ← Reactive Form with accordion on mobile
│   │       │   └── flight-details/     ← Selected flight detail panel
│   │       └── services/
│   │           └── flight.service.ts   ← Signals, BehaviorSubject, computed KPIs
│   │
│   ├── app.routes.ts                   ← Lazy-loaded dashboard route
│   └── app.config.ts                   ← provideHttpClient, provideAnimations, router
│
└── assets/
    └── mock-data/
        └── flights.json                ← 20 realistic international flights
```

---

## State Management Design

```
FlightService (Injectable, root)
│
├── allFlights$          BehaviorSubject → HttpClient JSON (shared replay)
├── filter$              BehaviorSubject<FilterState>
├── filteredFlights$     combineLatest([flights$, filter$]) → debounced pipe
│
├── selectedFlight       signal<Flight | null>   ← triggers map fly-to
├── kpis                 computed() from allFlightsSignal
├── filteredKpis         computed() from filteredFlightsSignal
├── uniqueOrigins        computed() → filter dropdowns
└── uniqueDestinations   computed() → filter dropdowns
```

**Data flow:**

```
JSON file → HttpClient
         → allFlights$ (shareReplay)
         → filteredFlights$ ← filter$ (debounce 300ms)
         → FlightList component
         → FlightMap component (via @Input signal)
         → KPI cards (computed signals)
```

---

## Responsive Breakpoints

| Viewport | KPI Grid | Content Layout |
|---|---|---|
| ≥ 1280px | 6 columns | List (380px) + Map (flex) side by side |
| 768–1024px | 3 columns | Map on top, List below |
| 480–768px | 2 columns | Map (360px) then List |
| ≤ 480px | 2 columns | Stacked, mobile card list |

Filters collapse into an accordion (`MatExpansionPanel`) on mobile.  
The flight table is hidden on mobile; card-based list is shown instead.

---

## Design Tokens (Aviation Theme)

| Token | Value | Usage |
|---|---|---|
| Primary | `#1565C0` | Header, buttons, accents |
| Secondary | `#0D47A1` | Darker primary variant |
| Accent | `#42A5F5` | Arrived status, map tooltips |
| Active | `#2E7D32` | Active flight markers |
| Delayed | `#F9A825` | Warning / delay markers |
| Cancelled | `#C62828` | Cancelled markers |
| Background | `#F5F7FA` | App background (light) |
| Dark BG | `#0f1117` | App background (dark) |

---

## Available Scripts

```bash
npm start          # ng serve (dev, port 4200)
npm run build      # ng build --configuration production
npm run watch      # ng build --watch --configuration development
npm test           # ng test (Karma/Jasmine)
```

---

## Key Angular 20 Patterns Used

- **`signal()`** — selected flight, loading state, map toggle states
- **`computed()`** — KPI aggregations derived from filtered flight list
- **`effect()`** — map re-renders when flights/selection signals change
- **`input()`** / **`input.required()`** — typed component inputs replacing `@Input()`
- **`toSignal()`** — bridging RxJS observables to Angular signals
- **`@if` / `@for` / `@switch`** — new template control flow (no `*ngIf` / `*ngFor`)
- **`inject()`** — DI without constructor injection
- **`ChangeDetectionStrategy.OnPush`** — every component
- **Lazy-loaded route** — dashboard feature loaded on demand
- **`provideAnimationsAsync()`** — async animation provider
- **`withViewTransitions()`** — smooth route transitions

---

*Built with Angular CLI 20 · Angular Material 20 · Leaflet 1.9 · TypeScript 5.9*
