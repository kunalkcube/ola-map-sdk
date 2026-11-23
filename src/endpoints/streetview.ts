import { OlaValidationError } from '../core/errors.js';
import type { HttpTransport, QueryParams } from '../core/transport.js';
import {
  assertFiniteNumber,
  assertNonEmptyString,
  assertRange,
  normalizeCoordinate,
  parseLatLngPair,
} from '../core/validate.js';
import type { CoordinateInput, RequestOptions } from '../types/common.js';
import type {
  StreetViewBBoxInput,
  StreetViewCoverageResponse,
  StreetViewImageIdOptions,
  StreetViewImageIdResponse,
  StreetViewMetadataResponse,
} from '../types/streetview.js';

export class StreetView {
  constructor(private readonly transport: HttpTransport) {}

  /**
   * Fetch Street View coverage geometry within a bounding box.
   * Accepts `{ xMin, yMin, xMax, yMax }` or `{ minLng, minLat, maxLng, maxLat }`.
   */
  getCoverage(
    bbox: StreetViewBBoxInput,
    requestOptions?: RequestOptions,
  ): Promise<StreetViewCoverageResponse> {
    if (!bbox || typeof bbox !== 'object') {
      throw new OlaValidationError(
        'bbox must be an object with { xMin, yMin, xMax, yMax } or { minLng, minLat, maxLng, maxLat }',
      );
    }

    const rawXMin = 'xMin' in bbox ? bbox.xMin : bbox.minLng;
    const rawYMin = 'yMin' in bbox ? bbox.yMin : bbox.minLat;
    const rawXMax = 'xMax' in bbox ? bbox.xMax : bbox.maxLng;
    const rawYMax = 'yMax' in bbox ? bbox.yMax : bbox.maxLat;

    const xMin = assertRange(assertFiniteNumber(rawXMin, 'xMin'), -180, 180, 'xMin');
    const yMin = assertRange(assertFiniteNumber(rawYMin, 'yMin'), -90, 90, 'yMin');
    const xMax = assertRange(assertFiniteNumber(rawXMax, 'xMax'), -180, 180, 'xMax');
    const yMax = assertRange(assertFiniteNumber(rawYMax, 'yMax'), -90, 90, 'yMax');

    if (xMin >= xMax || yMin >= yMax) {
      throw new OlaValidationError('bbox requires xMin < xMax and yMin < yMax');
    }

    return this.transport.request<StreetViewCoverageResponse>({
      method: 'GET',
      path: '/sli/v1/streetview/coverage',
      query: { xMin, yMin, xMax, yMax },
      requestOptions,
    });
  }

  /**
   * Fetch the nearest Street View `imageId` for a coordinate.
   */
  getImageId(
    lat: number | string,
    lon: number | string,
    options?: StreetViewImageIdOptions,
    requestOptions?: RequestOptions,
  ): Promise<StreetViewImageIdResponse>;
  getImageId(
    coordinate: Exclude<CoordinateInput, string>,
    options?: StreetViewImageIdOptions,
    requestOptions?: RequestOptions,
  ): Promise<StreetViewImageIdResponse>;
  getImageId(
    latOrCoordinate: number | string | Exclude<CoordinateInput, string>,
    lonOrOptions?: number | string | StreetViewImageIdOptions,
    optionsOrRequestOptions?: StreetViewImageIdOptions | RequestOptions,
    maybeRequestOptions?: RequestOptions,
  ): Promise<StreetViewImageIdResponse> {
    let lat: number;
    let lon: number;
    let options: StreetViewImageIdOptions | undefined;
    let requestOptions: RequestOptions | undefined;

    if (typeof latOrCoordinate === 'object' && latOrCoordinate !== null) {
      const normalized = normalizeCoordinate(latOrCoordinate, 'coordinate');
      lat = normalized.lat;
      lon = normalized.lng;
      options = lonOrOptions as StreetViewImageIdOptions | undefined;
      requestOptions = optionsOrRequestOptions as RequestOptions | undefined;
    } else {
      const parsed = parseLatLngPair(
        latOrCoordinate,
        lonOrOptions as number | string,
        'streetView.getImageId',
      );
      lat = parsed.lat;
      lon = parsed.lng;
      options = optionsOrRequestOptions as StreetViewImageIdOptions | undefined;
      requestOptions = maybeRequestOptions;
    }

    const query: QueryParams = { lat, lon };
    if (options?.radius != null) {
      query.radius = assertFiniteNumber(options.radius, 'options.radius');
    }

    return this.transport.request<StreetViewImageIdResponse>({
      method: 'GET',
      path: '/sli/streetview/imageId',
      query,
      requestOptions,
    });
  }

  /**
   * Fetch panoramic image metadata (`lat`, `lon`, `bearing`, `imageUrl`, `neighbors`) for an `imageId`.
   */
  getMetadata(
    imageId: string,
    requestOptions?: RequestOptions,
  ): Promise<StreetViewMetadataResponse> {
    return this.transport.request<StreetViewMetadataResponse>({
      method: 'GET',
      path: '/sli/streetview/metadata',
      query: { imageId: assertNonEmptyString(imageId, 'imageId') },
      requestOptions,
    });
  }
}
