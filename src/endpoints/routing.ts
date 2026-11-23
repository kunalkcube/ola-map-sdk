import { OlaValidationError } from '../core/errors.js';
import type { HttpTransport, QueryParams } from '../core/transport.js';
import { assertNonEmptyString, formatCoordinateList, formatLatLng } from '../core/validate.js';
import type { CoordinateInput, RequestOptions } from '../types/common.js';
import type {
  DirectionsBasicOptions,
  DirectionsOptions,
  DirectionsResponse,
  DistanceMatrixBasicOptions,
  DistanceMatrixOptions,
  DistanceMatrixResponse,
  FleetPlannerInput,
  FleetPlannerOptions,
  FleetPlannerResponse,
  FleetPlannerStrategy,
  RouteOptimizerOptions,
  RouteOptimizerResponse,
} from '../types/routing.js';

export class Routing {
  constructor(private readonly transport: HttpTransport) {}

  getDirections(
    origin: CoordinateInput,
    destination: CoordinateInput,
    options: DirectionsOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<DirectionsResponse> {
    const query: QueryParams = {
      origin: formatLatLng(origin, 'origin'),
      destination: formatLatLng(destination, 'destination'),
      alternatives: options.alternatives ?? false,
      steps: options.steps ?? true,
      overview: options.overview ?? 'full',
      language: options.language ?? 'en',
      traffic_metadata: options.traffic_metadata ?? false,
    };

    if (options.waypoints !== undefined) {
      query.waypoints = formatCoordinateList(options.waypoints, {
        label: 'options.waypoints',
        min: 1,
      });
    }
    if (options.mode) query.mode = options.mode;
    if (options.route_preference) query.route_preference = options.route_preference;

    return this.transport.request<DirectionsResponse>({
      method: 'POST',
      path: '/routing/v1/directions',
      query,
      requestOptions,
    });
  }

  getDirectionsBasic(
    origin: CoordinateInput,
    destination: CoordinateInput,
    options: DirectionsBasicOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<DirectionsResponse> {
    const query: QueryParams = {
      origin: formatLatLng(origin, 'origin'),
      destination: formatLatLng(destination, 'destination'),
      alternatives: options.alternatives ?? false,
      steps: options.steps ?? true,
      overview: options.overview ?? 'full',
      language: options.language ?? 'en',
    };

    if (options.waypoints !== undefined) {
      query.waypoints = formatCoordinateList(options.waypoints, {
        label: 'options.waypoints',
        min: 1,
      });
    }
    if (options.route_preference) query.route_preference = options.route_preference;

    return this.transport.request<DirectionsResponse>({
      method: 'POST',
      path: '/routing/v1/directions/basic',
      query,
      requestOptions,
    });
  }

  getDistanceMatrix(
    origins: string | readonly CoordinateInput[],
    destinations: string | readonly CoordinateInput[],
    options: DistanceMatrixOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<DistanceMatrixResponse> {
    const query: QueryParams = {
      origins: formatCoordinateList(origins, { label: 'origins', min: 1 }),
      destinations: formatCoordinateList(destinations, { label: 'destinations', min: 1 }),
      mode: options.mode ?? 'driving',
    };
    if (options.route_preference) query.route_preference = options.route_preference;

    return this.transport.request<DistanceMatrixResponse>({
      method: 'GET',
      path: '/routing/v1/distanceMatrix',
      query,
      requestOptions,
    });
  }

  getDistanceMatrixBasic(
    origins: string | readonly CoordinateInput[],
    destinations: string | readonly CoordinateInput[],
    options: DistanceMatrixBasicOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<DistanceMatrixResponse> {
    const query: QueryParams = {
      origins: formatCoordinateList(origins, { label: 'origins', min: 1 }),
      destinations: formatCoordinateList(destinations, { label: 'destinations', min: 1 }),
    };
    if (options.route_preference) query.route_preference = options.route_preference;

    return this.transport.request<DistanceMatrixResponse>({
      method: 'GET',
      path: '/routing/v1/distanceMatrix/basic',
      query,
      requestOptions,
    });
  }

  /**
   * Optimize waypoint order for up to 25 locations.
   */
  routeOptimizer(
    locations: string | readonly CoordinateInput[],
    options: RouteOptimizerOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<RouteOptimizerResponse> {
    const query: QueryParams = {
      locations: formatCoordinateList(locations, {
        label: 'locations',
        min: 1,
        max: 25,
      }),
      source: options.source ?? 'first',
      destination: options.destination ?? 'last',
      round_trip: options.round_trip ?? false,
      mode: options.mode ?? 'driving',
      steps: options.steps ?? true,
      overview: options.overview ?? 'full',
      language: options.language ?? 'en',
      traffic_metadata: options.traffic_metadata ?? false,
    };
    if (options.route_preference) query.route_preference = options.route_preference;

    return this.transport.request<RouteOptimizerResponse>({
      method: 'POST',
      path: '/routing/v1/routeOptimizer',
      query,
      requestOptions,
    });
  }

  /**
   * Plan multi-vehicle fleet routes using browser/Edge/Node-safe Web `FormData` & `Blob`.
   * Accepts a plain JSON object, JSON string, `Blob`/`File`, `Uint8Array`, or `ArrayBuffer`.
   */
  fleetPlanner(
    inputData: FleetPlannerInput,
    strategy: FleetPlannerStrategy,
    options: FleetPlannerOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<FleetPlannerResponse> {
    if (inputData === undefined || inputData === null) {
      throw new OlaValidationError('inputData is required');
    }
    const normalizedStrategy = assertNonEmptyString(strategy, 'strategy');
    const filename = options.filename ?? 'input.json';

    const form = new FormData();
    let blob: Blob;

    if (typeof Blob !== 'undefined' && inputData instanceof Blob) {
      blob = inputData;
    } else if (inputData instanceof ArrayBuffer) {
      blob = new Blob([inputData], { type: 'application/json' });
    } else if (inputData instanceof Uint8Array) {
      const copy = new Uint8Array(inputData.byteLength);
      copy.set(inputData);
      blob = new Blob([copy], { type: 'application/json' });
    } else if (typeof inputData === 'string') {
      blob = new Blob([inputData], { type: 'application/json' });
    } else if (typeof inputData === 'object') {
      blob = new Blob([JSON.stringify(inputData)], { type: 'application/json' });
    } else {
      throw new OlaValidationError(
        'inputData must be a JSON object, JSON string, Blob, Uint8Array, or ArrayBuffer',
      );
    }

    form.append('input', blob, filename);

    const query: QueryParams = {
      strategy: normalizedStrategy,
    };
    if (options.route_preference) query.route_preference = options.route_preference;

    return this.transport.request<FleetPlannerResponse>({
      method: 'POST',
      path: '/routing/v1/fleetPlanner',
      query,
      body: form,
      requestOptions,
    });
  }
}
