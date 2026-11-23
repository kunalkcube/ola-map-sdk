import { describe, expect, it } from 'vitest';
import { OlaMapsClient, OlaValidationError } from '../../src/index.js';
import { createJsonResponse, createMockFetch } from '../helpers.js';

describe('Routing endpoint', () => {
  it('accepts { lat, lng }, { lat, lon }, [lng, lat], and strings in directions & matrix', async () => {
    const requests: Array<{ method: string; url: URL; body?: BodyInit | null }> = [];
    const mockFetch = createMockFetch((url, init) => {
      requests.push({ method: init?.method ?? 'GET', url: new URL(url), body: init?.body });
      return createJsonResponse({ status: 'SUCCESS', routes: [], rows: [] });
    });

    const client = new OlaMapsClient({ apiKey: 'k', fetch: mockFetch });

    await client.routing.getDirections(
      { lat: 12.993, lng: 77.543 },
      { lat: 12.972, lon: 77.58 },
      { mode: 'driving', waypoints: [{ lat: 12.98, lng: 77.56 }] },
    );
    await client.routing.getDirectionsBasic([77.543, 12.993], '12.972,77.58');
    await client.routing.getDistanceMatrix(
      [{ lat: 12.993, lng: 77.543 }],
      [{ lat: 12.935, lng: 77.615 }],
    );
    await client.routing.getDistanceMatrixBasic('12.993,77.543', '12.935,77.615');
    await client.routing.routeOptimizer('12.993,77.543|12.972,77.58|12.935,77.615');
    await client.routing.fleetPlanner({ packages: [], vehicles: [] }, 'optimal');

    expect(requests.map((r) => `${r.method} ${r.url.pathname}`)).toEqual([
      'POST /routing/v1/directions',
      'POST /routing/v1/directions/basic',
      'GET /routing/v1/distanceMatrix',
      'GET /routing/v1/distanceMatrix/basic',
      'POST /routing/v1/routeOptimizer',
      'POST /routing/v1/fleetPlanner',
    ]);

    expect(requests[0]!.url.searchParams.get('origin')).toBe('12.993,77.543');
    expect(requests[0]!.url.searchParams.get('destination')).toBe('12.972,77.58');
    expect(requests[0]!.url.searchParams.get('waypoints')).toBe('12.98,77.56');
    expect(requests[1]!.url.searchParams.get('origin')).toBe('12.993,77.543');
    expect(requests[5]!.body).toBeInstanceOf(FormData);
    expect(requests[5]!.url.searchParams.get('strategy')).toBe('optimal');
  });

  it('enforces routeOptimizer max 25 locations cap', () => {
    const client = new OlaMapsClient({
      apiKey: 'k',
      fetch: createMockFetch(() => createJsonResponse({})),
    });
    const tooMany = Array.from({ length: 26 }, (_, i) => ({ lat: 12 + i * 0.01, lng: 77.6 }));
    expect(() => client.routing.routeOptimizer(tooMany)).toThrow(OlaValidationError);
  });

  it('supports Blob and Uint8Array inputs in fleetPlanner without Node fs', async () => {
    const mockFetch = createMockFetch((_url, init) => {
      expect(init?.body).toBeInstanceOf(FormData);
      const form = init?.body as FormData;
      expect(form.get('input')).toBeInstanceOf(Blob);
      return createJsonResponse({ status: 'ok' });
    });

    const client = new OlaMapsClient({ apiKey: 'k', fetch: mockFetch });
    const bytes = new TextEncoder().encode(JSON.stringify({ vehicles: [] }));
    await client.routing.fleetPlanner(bytes, 'distance');
    await client.routing.fleetPlanner(new Blob(['{}'], { type: 'application/json' }), 'optimal');
  });
});
