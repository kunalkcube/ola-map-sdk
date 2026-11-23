import { describe, expect, it } from 'vitest';
import { OlaMapsClient, OlaValidationError } from '../../src/index.js';
import { createJsonResponse, createMockFetch } from '../helpers.js';

describe('Places endpoint', () => {
  it('calls all 10 Places endpoints with correct paths and params', async () => {
    const seenUrls: URL[] = [];
    const mockFetch = createMockFetch((url) => {
      seenUrls.push(new URL(url));
      return createJsonResponse({
        status: 'ok',
        predictions: [],
        results: [],
        geocodingResults: [],
      });
    });

    const client = new OlaMapsClient({ apiKey: 'k', fetch: mockFetch });

    await client.places.autocomplete('Koramangala', {
      location: { lat: 12.93, lng: 77.61 },
      radius: 5000,
      strictbounds: true,
      language: 'en',
      types: 'locality',
    });
    await client.places.geocode('Taj Mahal', 'hi');
    await client.places.reverseGeocode('12.931', '77.616', 'en');
    await client.places.reverseGeocode({ lat: 12.931, lon: 77.616 });
    await client.places.placeDetails('ola-platform:1', 'en');
    await client.places.placeDetailsAdvanced('ola-platform:1');
    await client.places.nearbySearch([77.61, 12.93], {
      layers: 'venue',
      types: 'cafe',
      limit: 25,
      rankBy: 'distance',
    });
    await client.places.nearbySearchAdvanced('12.93,77.61', { layers: 'venue', limit: 50 });
    await client.places.textSearch('Cafes', { location: '12.93,77.61', size: 10 });
    await client.places.addressValidation('7 Lok Kalyan Marg');
    await client.places.photo('photo_ref_1');

    expect(seenUrls.map((u) => u.pathname)).toEqual([
      '/places/v1/autocomplete',
      '/places/v1/geocode',
      '/places/v1/reverse-geocode',
      '/places/v1/reverse-geocode',
      '/places/v1/details',
      '/places/v1/details/advanced',
      '/places/v1/nearbysearch',
      '/places/v1/nearbysearch/advanced',
      '/places/v1/textsearch',
      '/places/v1/addressvalidation',
      '/places/v1/photo',
    ]);

    expect(seenUrls[0]!.searchParams.get('location')).toBe('12.93,77.61');
    expect(seenUrls[1]!.searchParams.get('language')).toBe('hi');
    expect(seenUrls[2]!.searchParams.get('latlng')).toBe('12.931,77.616');
    expect(seenUrls[3]!.searchParams.get('latlng')).toBe('12.931,77.616');
    expect(seenUrls[6]!.searchParams.get('location')).toBe('12.93,77.61');
    expect(seenUrls[6]!.searchParams.get('layers')).toBe('venue');
    expect(seenUrls[6]!.searchParams.get('limit')).toBe('25');
    expect(seenUrls[7]!.searchParams.get('layers')).toBe('venue');
  });

  it('enforces nearbySearch limit <= 50 and validates required params', () => {
    const client = new OlaMapsClient({
      apiKey: 'k',
      fetch: createMockFetch(() => createJsonResponse({})),
    });

    expect(() => client.places.nearbySearch('12.93,77.61', { limit: 51 })).toThrow(
      OlaValidationError,
    );
    expect(() => client.places.nearbySearchAdvanced('12.93,77.61', { limit: 0 })).toThrow(
      OlaValidationError,
    );
    expect(() => client.places.autocomplete('')).toThrow(OlaValidationError);
    expect(() => client.places.reverseGeocode(95, 77)).toThrow(OlaValidationError);
    expect(() => client.places.placeDetails('')).toThrow(OlaValidationError);
  });
});
