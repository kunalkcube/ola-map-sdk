import type { HttpTransport, QueryParams } from '../core/transport.js';
import { assertFiniteNumber, assertOneOf, formatCoordinateList } from '../core/validate.js';
import type { CoordinateInput, RequestOptions } from '../types/common.js';
import type {
  NearestRoadsMode,
  NearestRoadsOptions,
  NearestRoadsResponse,
  SnapStrategy,
  SnapToRoadOptions,
  SnapToRoadResponse,
  SpeedLimitsOptions,
  SpeedLimitsResponse,
} from '../types/roads.js';

const NEAREST_ROADS_MODES: readonly NearestRoadsMode[] = [
  'DRIVING',
  'WALKING',
  'BICYCLING',
  'TRANSIT',
];
const SNAP_STRATEGIES: readonly SnapStrategy[] = ['snaptoroad', 'nearestroad'];

export class Roads {
  constructor(private readonly transport: HttpTransport) {}

  /**
   * Snap up to 50 coordinates to the nearest road segments.
   */
  snapToRoad(
    points: string | readonly CoordinateInput[],
    enhancePathOrOptions: boolean | SnapToRoadOptions = false,
    requestOptions?: RequestOptions,
  ): Promise<SnapToRoadResponse> {
    const formattedPoints = formatCoordinateList(points, {
      label: 'points',
      min: 1,
      max: 50,
    });
    const enhancePath =
      typeof enhancePathOrOptions === 'boolean'
        ? enhancePathOrOptions
        : (enhancePathOrOptions.enhancePath ?? false);

    return this.transport.request<SnapToRoadResponse>({
      method: 'GET',
      path: '/routing/v1/snapToRoad',
      query: { points: formattedPoints, enhancePath },
      requestOptions,
    });
  }

  /**
   * Find nearest roads for up to 100 coordinates.
   */
  nearestRoads(
    points: string | readonly CoordinateInput[],
    mode: NearestRoadsMode,
    radiusOrOptions?: number | NearestRoadsOptions,
    requestOptions?: RequestOptions,
  ): Promise<NearestRoadsResponse> {
    const formattedPoints = formatCoordinateList(points, {
      label: 'points',
      min: 1,
      max: 100,
    });
    const validatedMode = assertOneOf(mode, NEAREST_ROADS_MODES, 'mode');

    const query: QueryParams = {
      points: formattedPoints,
      mode: validatedMode,
    };

    const radius = typeof radiusOrOptions === 'number' ? radiusOrOptions : radiusOrOptions?.radius;
    if (radius != null) {
      query.radius = assertFiniteNumber(radius, 'radius');
    }

    return this.transport.request<NearestRoadsResponse>({
      method: 'GET',
      path: '/routing/v1/nearestRoads',
      query,
      requestOptions,
    });
  }

  /**
   * Get speed limits for up to 50 coordinates along snapped road segments.
   */
  speedLimits(
    points: string | readonly CoordinateInput[],
    snapStrategyOrOptions: SnapStrategy | SpeedLimitsOptions = 'snaptoroad',
    requestOptions?: RequestOptions,
  ): Promise<SpeedLimitsResponse> {
    const formattedPoints = formatCoordinateList(points, {
      label: 'points',
      min: 1,
      max: 50,
    });
    const rawStrategy =
      typeof snapStrategyOrOptions === 'string'
        ? snapStrategyOrOptions
        : (snapStrategyOrOptions.snapStrategy ?? 'snaptoroad');
    const snapStrategy = assertOneOf(rawStrategy, SNAP_STRATEGIES, 'snapStrategy');

    return this.transport.request<SpeedLimitsResponse>({
      method: 'GET',
      path: '/routing/v1/speedLimits',
      query: { points: formattedPoints, snapStrategy },
      requestOptions,
    });
  }
}
