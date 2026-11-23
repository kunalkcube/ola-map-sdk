import type { CoordinateInput, LatLng } from './common.js';

export type RoutingMode =
  | 'driving'
  | 'walking'
  | 'auto'
  | 'two_wheeler'
  | 'cycling'
  | (string & {});
export type RouteOverview = 'full' | 'simplified' | 'false';

export interface DirectionsOptions {
  alternatives?: boolean;
  steps?: boolean;
  overview?: RouteOverview;
  language?: string;
  traffic_metadata?: boolean;
  waypoints?: string | readonly CoordinateInput[];
  mode?: RoutingMode;
  route_preference?: string;
}

export interface DirectionsBasicOptions {
  alternatives?: boolean;
  steps?: boolean;
  overview?: RouteOverview;
  language?: string;
  waypoints?: string | readonly CoordinateInput[];
  route_preference?: string;
}

export interface RouteStep {
  instructions?: string;
  distance: number;
  readable_distance?: string;
  maneuver?: string;
  duration: number;
  readable_duration?: string;
  start_location: LatLng;
  end_location: LatLng;
  bearing_before?: number;
  bearing_after?: number;
}

export interface RouteLeg {
  steps?: RouteStep[];
  distance: number;
  readable_distance?: string;
  duration: number;
  readable_duration?: string;
  start_location: LatLng;
  end_location: LatLng;
  start_address?: string;
  end_address?: string;
}

export interface Route {
  summary?: string;
  legs: RouteLeg[];
  overview_polyline?: string;
  travel_advisory?: string;
  bounds?: Record<string, unknown>;
  copyrights?: string;
  warnings?: string[];
}

export interface DirectionsResponse {
  status: string;
  geocoded_waypoints?: Array<{
    geocoder_status?: string;
    place_id?: string;
    types?: string[];
  }>;
  routes: Route[];
  source_from?: string;
}

export interface DistanceMatrixOptions {
  mode?: RoutingMode;
  route_preference?: string;
}

export interface DistanceMatrixBasicOptions {
  route_preference?: string;
}

export interface DistanceMatrixElement {
  duration?: number;
  distance?: number;
  polyline?: string;
  status: string;
}

export interface DistanceMatrixResponse {
  status: string;
  rows: Array<{
    elements: DistanceMatrixElement[];
  }>;
}

export interface RouteOptimizerOptions {
  source?: 'first' | 'any';
  destination?: 'last' | 'any';
  round_trip?: boolean;
  mode?: RoutingMode;
  steps?: boolean;
  overview?: RouteOverview;
  language?: string;
  traffic_metadata?: boolean;
  route_preference?: string;
}

export interface RouteOptimizerResponse extends DirectionsResponse {
  waypoints?: Array<{
    waypoint_index?: number;
    trips_index?: number;
    location?: LatLng;
    [key: string]: unknown;
  }>;
}

export type FleetPlannerStrategy = 'optimal' | 'distance' | 'duration' | (string & {});

export interface FleetPlannerOptions {
  route_preference?: string;
  /** Optional filename used in multipart FormData upload (default: `'input.json'`). */
  filename?: string;
}

export type FleetPlannerInput = Record<string, unknown> | Blob | Uint8Array | ArrayBuffer | string;

export interface FleetPlannerResponse {
  status?: string;
  routes?: unknown[];
  unassigned?: unknown[];
  [key: string]: unknown;
}
