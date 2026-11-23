import type { CoordinateInput, LatLng } from '../types/common.js';
import { OlaValidationError } from './errors.js';

export function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new OlaValidationError(`${fieldName} must be a non-empty string`);
  }
  return value.trim();
}

export function assertFiniteNumber(value: unknown, fieldName: string): number {
  const num = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    throw new OlaValidationError(`${fieldName} must be a finite number`);
  }
  return num;
}

export function assertRange(value: number, min: number, max: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new OlaValidationError(
      `${fieldName} must be between ${min} and ${max} (received ${value})`,
    );
  }
  return value;
}

export function assertOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string,
): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new OlaValidationError(`${fieldName} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

/**
 * Parse and validate a `(lat, lng)` pair accepting numbers or numeric strings.
 */
export function parseLatLngPair(
  lat: number | string,
  lng: number | string,
  label = 'coordinate',
): LatLng {
  const parsedLat = assertRange(assertFiniteNumber(lat, `${label}.lat`), -90, 90, `${label}.lat`);
  const parsedLng = assertRange(assertFiniteNumber(lng, `${label}.lng`), -180, 180, `${label}.lng`);
  return { lat: parsedLat, lng: parsedLng };
}

/**
 * Normalize any supported coordinate input into `{ lat, lng }` with range validation.
 *
 * Supported formats:
 * - `{ lat, lng }`
 * - `{ lat, lon }`
 * - `[lng, lat]` (GeoJSON / MapLibre order)
 * - `"lat,lng"` string
 */
export function normalizeCoordinate(input: CoordinateInput, label = 'coordinate'): LatLng {
  if (typeof input === 'string') {
    const parts = input.split(',');
    if (parts.length !== 2) {
      throw new OlaValidationError(`${label} string must be in "lat,lng" format`);
    }
    return parseLatLngPair(parts[0]!.trim(), parts[1]!.trim(), label);
  }

  if (Array.isArray(input)) {
    if (input.length !== 2) {
      throw new OlaValidationError(`${label} tuple must be [lng, lat] with exactly 2 elements`);
    }
    // GeoJSON / MapLibre convention: [lng, lat]
    return parseLatLngPair(input[1] as number, input[0] as number, label);
  }

  if (input !== null && typeof input === 'object') {
    const obj = input as { lat?: unknown; lng?: unknown; lon?: unknown };
    const rawLng = obj.lng !== undefined ? obj.lng : obj.lon;
    if (obj.lat === undefined || rawLng === undefined) {
      throw new OlaValidationError(`${label} object must include "lat" and "lng" (or "lon")`);
    }
    return parseLatLngPair(obj.lat as number | string, rawLng as number | string, label);
  }

  throw new OlaValidationError(
    `${label} must be { lat, lng }, { lat, lon }, [lng, lat], or "lat,lng"`,
  );
}

/**
 * Format any supported coordinate input into Ola Maps' `"lat,lng"` wire format.
 */
export function formatLatLng(input: CoordinateInput, label = 'coordinate'): string {
  const { lat, lng } = normalizeCoordinate(input, label);
  return `${lat},${lng}`;
}

export interface CoordinateListOptions {
  label: string;
  min?: number;
  max?: number;
}

/**
 * Validate and format a pipe-separated coordinate list (string or array of CoordinateInput).
 */
export function formatCoordinateList(
  input: string | readonly CoordinateInput[],
  options: CoordinateListOptions,
): string {
  const { label, min = 1, max } = options;
  let rawItems: readonly CoordinateInput[];

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new OlaValidationError(`${label} must not be empty`);
    }
    rawItems = trimmed.split('|').map((item) => item.trim());
  } else if (Array.isArray(input)) {
    rawItems = input;
  } else {
    throw new OlaValidationError(
      `${label} must be a pipe-separated string or an array of coordinates`,
    );
  }

  if (rawItems.length < min) {
    throw new OlaValidationError(`${label} requires at least ${min} coordinate(s)`);
  }
  if (max !== undefined && rawItems.length > max) {
    throw new OlaValidationError(
      `${label} supports at most ${max} coordinates (received ${rawItems.length})`,
    );
  }

  return rawItems.map((coord, i) => formatLatLng(coord, `${label}[${i}]`)).join('|');
}
