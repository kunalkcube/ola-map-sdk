import { describe, expect, it } from 'vitest';
import OlaMapsClientDefault, { OlaMapsClient, OlaValidationError } from '../src/index.js';
import { createJsonResponse, createMockFetch } from './helpers.js';

describe('OlaMapsClient', () => {
  it('exports OlaMapsClient as both default and named export', () => {
    expect(OlaMapsClientDefault).toBe(OlaMapsClient);
  });

  it('maintains v1 backward-compatible constructor `new OlaMapsClient("api-key")`', () => {
    const client = new OlaMapsClient('test-key');
    expect(client.authMode).toBe('apiKey');
    expect(client.places).toBeDefined();
    expect(client.routing).toBeDefined();
    expect(client.roads).toBeDefined();
    expect(client.geofencing).toBeDefined();
    expect(client.elevation).toBeDefined();
    expect(client.tiles).toBeDefined();
    expect(client.streetView).toBeDefined();
  });

  it('throws OlaValidationError for empty API key', () => {
    expect(() => new OlaMapsClient('')).toThrow(OlaValidationError);
    expect(() => new OlaMapsClient('   ')).toThrow(OlaValidationError);
  });

  it('provides host-safe MapLibre helpers on client instance', () => {
    const client = new OlaMapsClient('my-key');
    expect(client.getStyleURL('default-dark-standard')).toBe(
      'https://api.olamaps.io/tiles/vector/v1/styles/default-dark-standard/style.json',
    );

    const transform = client.getTransformRequest();
    expect(transform('https://app.olamaps.io/tiles/vector/v1/data/planet.json').url).toBe(
      'https://api.olamaps.io/tiles/vector/v1/data/planet.json?api_key=my-key',
    );
    // Must NEVER leak key to third-party host!
    expect(transform('https://cdn.example.com/sprites/icons.png').url).toBe(
      'https://cdn.example.com/sprites/icons.png',
    );

    const opts = client.getMapOptions({ container: 'map', style: 'bolt-dark', zoom: 12 });
    expect(opts.style).toBe('https://api.olamaps.io/tiles/vector/v1/styles/bolt-dark/style.json');
    expect(opts.zoom).toBe(12);
    expect(opts.center).toEqual([77.61, 12.93]);
  });

  it('uses proxy baseUrl in MapLibre helpers when configured in Proxy Mode', async () => {
    const mockFetch = createMockFetch(() => createJsonResponse({}));
    const client = new OlaMapsClient({ baseUrl: '/api/ola-maps', fetch: mockFetch });

    expect(client.getStyleURL('default-light-standard')).toBe(
      '/api/ola-maps/tiles/vector/v1/styles/default-light-standard/style.json',
    );
    const transform = client.getTransformRequest();
    expect(transform('https://api.olamaps.io/tiles/vector/v1/data/planet.json').url).toBe(
      '/api/ola-maps/tiles/vector/v1/data/planet.json',
    );
  });
});
