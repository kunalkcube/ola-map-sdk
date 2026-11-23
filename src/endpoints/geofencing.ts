import { OlaValidationError } from '../core/errors.js';
import type { HttpTransport } from '../core/transport.js';
import { assertFiniteNumber, assertNonEmptyString, formatLatLng } from '../core/validate.js';
import type { CoordinateInput, RequestOptions } from '../types/common.js';
import type {
  GeofenceCreatePayload,
  GeofenceListResponse,
  GeofenceRecord,
  GeofenceStatusResponse,
  GeofenceUpdatePayload,
} from '../types/geofencing.js';

export class Geofencing {
  constructor(private readonly transport: HttpTransport) {}

  create(
    geofenceData: GeofenceCreatePayload,
    requestOptions?: RequestOptions,
  ): Promise<GeofenceRecord> {
    if (!geofenceData || typeof geofenceData !== 'object') {
      throw new OlaValidationError('geofenceData is required');
    }

    return this.transport.request<GeofenceRecord>({
      method: 'POST',
      path: '/places/v1/geofence',
      body: geofenceData,
      requestOptions,
    });
  }

  update(
    id: string,
    geofenceData: GeofenceUpdatePayload,
    requestOptions?: RequestOptions,
  ): Promise<GeofenceRecord> {
    const validatedId = assertNonEmptyString(id, 'id');
    if (!geofenceData || typeof geofenceData !== 'object') {
      throw new OlaValidationError('geofenceData is required');
    }

    return this.transport.request<GeofenceRecord>({
      method: 'PUT',
      path: `/places/v1/geofence/${encodeURIComponent(validatedId)}`,
      body: geofenceData,
      requestOptions,
    });
  }

  getById(id: string, requestOptions?: RequestOptions): Promise<GeofenceRecord> {
    const validatedId = assertNonEmptyString(id, 'id');
    return this.transport.request<GeofenceRecord>({
      method: 'GET',
      path: `/places/v1/geofence/${encodeURIComponent(validatedId)}`,
      requestOptions,
    });
  }

  deleteById(id: string, requestOptions?: RequestOptions): Promise<Record<string, unknown>> {
    const validatedId = assertNonEmptyString(id, 'id');
    return this.transport.request<Record<string, unknown>>({
      method: 'DELETE',
      path: `/places/v1/geofence/${encodeURIComponent(validatedId)}`,
      requestOptions,
    });
  }

  list(
    projectId: string,
    page = 1,
    size = 10,
    requestOptions?: RequestOptions,
  ): Promise<GeofenceListResponse> {
    const validatedProjectId = assertNonEmptyString(projectId, 'projectId');
    return this.transport.request<GeofenceListResponse>({
      method: 'GET',
      path: '/places/v1/geofences',
      query: {
        projectId: validatedProjectId,
        page: assertFiniteNumber(page, 'page'),
        size: assertFiniteNumber(size, 'size'),
      },
      requestOptions,
    });
  }

  checkStatus(
    geofenceId: string,
    coordinates: CoordinateInput,
    requestOptions?: RequestOptions,
  ): Promise<GeofenceStatusResponse> {
    return this.transport.request<GeofenceStatusResponse>({
      method: 'GET',
      path: '/places/v1/geofence/status',
      query: {
        geofenceId: assertNonEmptyString(geofenceId, 'geofenceId'),
        coordinates: formatLatLng(coordinates, 'coordinates'),
      },
      requestOptions,
    });
  }
}
