import { OlaValidationError } from '../core/errors.js';
import type { HttpTransport } from '../core/transport.js';
import { formatLatLng, parseLatLngPair } from '../core/validate.js';
import type { CoordinateInput, RequestOptions } from '../types/common.js';
import type { ElevationResponse, MultiElevationResponse } from '../types/elevation.js';

export class Elevation {
  constructor(private readonly transport: HttpTransport) {}

  /**
   * Get elevation for a single location.
   */
  getElevation(
    lat: number | string,
    lng: number | string,
    requestOptions?: RequestOptions,
  ): Promise<ElevationResponse>;
  getElevation(
    coordinate: CoordinateInput,
    requestOptions?: RequestOptions,
  ): Promise<ElevationResponse>;
  getElevation(
    latOrCoord: number | string | CoordinateInput,
    lngOrRequestOptions?: number | string | RequestOptions,
    maybeRequestOptions?: RequestOptions,
  ): Promise<ElevationResponse> {
    let location: string;
    let requestOptions: RequestOptions | undefined;

    if (
      (typeof latOrCoord === 'object' && latOrCoord !== null) ||
      (typeof latOrCoord === 'string' && latOrCoord.includes(','))
    ) {
      location = formatLatLng(latOrCoord as CoordinateInput, 'location');
      requestOptions = lngOrRequestOptions as RequestOptions | undefined;
    } else {
      const parsed = parseLatLngPair(
        latOrCoord as number | string,
        lngOrRequestOptions as number | string,
        'location',
      );
      location = `${parsed.lat},${parsed.lng}`;
      requestOptions = maybeRequestOptions;
    }

    return this.transport.request<ElevationResponse>({
      method: 'GET',
      path: '/places/v1/elevation',
      query: { location },
      requestOptions,
    });
  }

  /**
   * Get elevations for multiple locations (max 25 per request).
   */
  getMultiElevation(
    locations: readonly CoordinateInput[],
    requestOptions?: RequestOptions,
  ): Promise<MultiElevationResponse> {
    if (!Array.isArray(locations) || locations.length === 0) {
      throw new OlaValidationError('locations must be a non-empty array of coordinates');
    }
    if (locations.length > 25) {
      throw new OlaValidationError(
        `Maximum 25 locations allowed per request (received ${locations.length})`,
      );
    }

    const formatted = locations.map((loc, index) => formatLatLng(loc, `locations[${index}]`));

    return this.transport.request<MultiElevationResponse>({
      method: 'POST',
      path: '/places/v1/elevation',
      body: { locations: formatted },
      requestOptions,
    });
  }
}
