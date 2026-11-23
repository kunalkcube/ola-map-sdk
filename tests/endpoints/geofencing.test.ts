import { describe, expect, it } from 'vitest';
import { OlaMapsClient, OlaValidationError } from '../../src/index.js';
import { createJsonResponse, createMockFetch } from '../helpers.js';

describe('Geofencing endpoint', () => {
  it('supports full CRUD, listing, and status checks', async () => {
    const calls: Array<{ method: string; path: string; search: string }> = [];
    const mockFetch = createMockFetch((url, init) => {
      const parsed = new URL(url);
      calls.push({ method: init?.method ?? 'GET', path: parsed.pathname, search: parsed.search });
      return createJsonResponse({ id: 'gf-1', isInside: true });
    });

    const client = new OlaMapsClient({ apiKey: 'k', fetch: mockFetch });
    await client.geofencing.create({
      name: 'Hub',
      type: 'circle',
      coordinates: [[12.931, 77.615]],
      radius: 200,
      status: 'active',
      projectId: 'proj-1',
    });
    await client.geofencing.update('gf-1', { name: 'Hub Updated' });
    await client.geofencing.getById('gf-1');
    await client.geofencing.deleteById('gf-1');
    await client.geofencing.list('proj-1', 2, 20);
    await client.geofencing.checkStatus('gf-1', { lat: 12.93, lng: 77.61 });

    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'POST /places/v1/geofence',
      'PUT /places/v1/geofence/gf-1',
      'GET /places/v1/geofence/gf-1',
      'DELETE /places/v1/geofence/gf-1',
      'GET /places/v1/geofences',
      'GET /places/v1/geofence/status',
    ]);
    expect(calls[4]!.search).toContain('projectId=proj-1&page=2&size=20');
    expect(calls[5]!.search).toContain('coordinates=12.93%2C77.61');
  });

  it('validates required ids', () => {
    const client = new OlaMapsClient({
      apiKey: 'k',
      fetch: createMockFetch(() => createJsonResponse({})),
    });
    expect(() => client.geofencing.getById('')).toThrow(OlaValidationError);
    expect(() => client.geofencing.list('')).toThrow(OlaValidationError);
  });
});
