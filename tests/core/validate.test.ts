import { describe, expect, it } from 'vitest';
import { OlaValidationError } from '../../src/core/errors.js';
import {
  formatCoordinateList,
  formatLatLng,
  normalizeCoordinate,
  parseLatLngPair,
} from '../../src/core/validate.js';

describe('coordinate normalization & validation', () => {
  it('normalizes { lat, lng }, { lat, lon }, [lng, lat], and "lat,lng"', () => {
    expect(normalizeCoordinate({ lat: 12.93, lng: 77.61 })).toEqual({ lat: 12.93, lng: 77.61 });
    expect(normalizeCoordinate({ lat: 12.93, lon: 77.61 })).toEqual({ lat: 12.93, lng: 77.61 });
    expect(normalizeCoordinate([77.61, 12.93])).toEqual({ lat: 12.93, lng: 77.61 });
    expect(normalizeCoordinate('12.93, 77.61')).toEqual({ lat: 12.93, lng: 77.61 });
  });

  it('formats any coordinate input to "lat,lng"', () => {
    expect(formatLatLng([77.61, 12.93])).toBe('12.93,77.61');
    expect(formatLatLng({ lat: 12.93, lon: 77.61 })).toBe('12.93,77.61');
  });

  it('accepts numeric strings in parseLatLngPair', () => {
    expect(parseLatLngPair('12.931', '77.616')).toEqual({ lat: 12.931, lng: 77.616 });
  });

  it('rejects out-of-range coordinates', () => {
    expect(() => normalizeCoordinate({ lat: 95, lng: 77 })).toThrow(OlaValidationError);
    expect(() => normalizeCoordinate({ lat: 12, lng: 190 })).toThrow(OlaValidationError);
    expect(() => normalizeCoordinate('invalid')).toThrow(OlaValidationError);
    expect(() => parseLatLngPair(Number.NaN, 77)).toThrow(OlaValidationError);
  });

  it('formats pipe-separated strings and arrays while enforcing max caps', () => {
    expect(
      formatCoordinateList([{ lat: 12.93, lng: 77.61 }, [77.62, 12.94], '12.95,77.63'], {
        label: 'points',
        max: 5,
      }),
    ).toBe('12.93,77.61|12.94,77.62|12.95,77.63');

    expect(() =>
      formatCoordinateList('12.93,77.61|12.94,77.62|12.95,77.63', { label: 'points', max: 2 }),
    ).toThrow(OlaValidationError);
  });
});
