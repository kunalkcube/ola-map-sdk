import { describe, expect, it } from 'vitest';
import { OlaMapsClient, OlaValidationError } from '../../src/index.js';
import { createJsonResponse, createMockFetch } from '../helpers.js';

describe('Elevation endpoint', () => {
  it('supports single and multi-elevation with coordinate validation', async () => {
    const seen: Array<{ method: string; url: URL; body?: BodyInit | null }> = [];
    const mockFetch = createMockFetch((url, init) => {
      seen.push({ method: init?.method ?? 'GET', url: new URL(url), body: init?.body });
      return createJsonResponse({ status: 'ok', results: [] });
    });

    const client = new OlaMapsClient({ apiKey: 'k', fetch: mockFetch });
    await client.elevation.getElevation(12.93126, 77.61638);
    await client.elevation.getElevation({ lat: 12.93, lng: 77.61 });
    await client.elevation.getMultiElevation(['12.931,77.616', { lat: 12.897, lon: 77.651 }]);

    expect(seen[0]!.url.pathname).toBe('/places/v1/elevation');
    expect(seen[0]!.url.searchParams.get('location')).toBe('12.93126,77.61638');
    expect(seen[1]!.url.searchParams.get('location')).toBe('12.93,77.61');
    expect(seen[2]!.method).toBe('POST');
    expect(JSON.parse(String(seen[2]!.body))).toEqual({
      locations: ['12.931,77.616', '12.897,77.651'],
    });
  });

  it('enforces max 25 locations and valid ranges', () => {
    const client = new OlaMapsClient({
      apiKey: 'k',
      fetch: createMockFetch(() => createJsonResponse({})),
    });
    expect(() => client.elevation.getElevation(99, 77)).toThrow(OlaValidationError);
    expect(() => client.elevation.getMultiElevation([])).toThrow(OlaValidationError);
    expect(() =>
      client.elevation.getMultiElevation(Array.from({ length: 26 }, () => '12.93,77.61')),
    ).toThrow(OlaValidationError);
  });
});
