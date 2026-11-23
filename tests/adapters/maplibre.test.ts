import { describe, expect, it } from 'vitest';
import {
  getMapOptions,
  getStyleURL,
  getTransformRequest,
  isOlaMapsHost,
} from '../../src/maplibre/index.js';

describe('ola-map-sdk/maplibre adapter', () => {
  it('strictly validates Ola Maps hostnames', () => {
    expect(isOlaMapsHost('api.olamaps.io')).toBe(true);
    expect(isOlaMapsHost('app.olamaps.io')).toBe(true);
    expect(isOlaMapsHost('olamaps.io')).toBe(true);
    expect(isOlaMapsHost('evil-olamaps.io')).toBe(false);
    expect(isOlaMapsHost('api.olamaps.io.attacker.com')).toBe(false);
    expect(isOlaMapsHost('cdn.jsdelivr.net')).toBe(false);
  });

  it('never leaks api_key or Bearer token to non-Ola domains', () => {
    const withKey = getTransformRequest({ apiKey: 'secret_key' });

    expect(withKey('https://api.olamaps.io/tiles/vector/v1/styles.json').url).toBe(
      'https://api.olamaps.io/tiles/vector/v1/styles.json?api_key=secret_key',
    );
    expect(withKey('https://app.olamaps.io/tiles/vector/v1/data/planet/1/2/3.pbf').url).toBe(
      'https://api.olamaps.io/tiles/vector/v1/data/planet/1/2/3.pbf?api_key=secret_key',
    );
    // Lookalike / attacker / third-party hosts MUST NOT receive credentials or hostname rewrite
    expect(withKey('https://app.olamaps.io.evil.com/steal').url).toBe(
      'https://app.olamaps.io.evil.com/steal',
    );
    expect(withKey('https://tiles.thirdparty.dev/overlay.json').url).toBe(
      'https://tiles.thirdparty.dev/overlay.json',
    );
    expect(withKey('data:image/png;base64,abc').url).toBe('data:image/png;base64,abc');

    const withBearer = getTransformRequest({ accessToken: 'jwt_123' });
    expect(withBearer('https://api.olamaps.io/tiles/vector/v1/styles.json')).toEqual({
      url: 'https://api.olamaps.io/tiles/vector/v1/styles.json',
      headers: { Authorization: 'Bearer jwt_123' },
    });
    expect(withBearer('https://cdn.example.com/font.pbf')).toEqual({
      url: 'https://cdn.example.com/font.pbf',
    });
  });

  it('rewrites Ola Maps requests to proxyBaseUrl in Proxy Mode without credentials', () => {
    const proxyTransform = getTransformRequest({ proxyBaseUrl: '/api/ola-maps' });
    expect(
      proxyTransform(
        'https://api.olamaps.io/tiles/vector/v1/data/planet/14/1/2.pbf?foo=1&api_key=old',
      ).url,
    ).toBe('/api/ola-maps/tiles/vector/v1/data/planet/14/1/2.pbf?foo=1');
    expect(proxyTransform('https://other.cdn.com/asset.png').url).toBe(
      'https://other.cdn.com/asset.png',
    );
  });

  it('builds complete MapLibre options with style resolution', () => {
    expect(getStyleURL('eclipse-dark-standard')).toBe(
      'https://api.olamaps.io/tiles/vector/v1/styles/eclipse-dark-standard/style.json',
    );

    const opts = getMapOptions(
      { proxyBaseUrl: '/api/ola-maps' },
      { container: 'map', style: 'default-light-standard', center: [77.6, 12.9], zoom: 13 },
    );
    expect(opts.style).toBe(
      '/api/ola-maps/tiles/vector/v1/styles/default-light-standard/style.json',
    );
    expect(opts.center).toEqual([77.6, 12.9]);
    expect(opts.zoom).toBe(13);
  });
});
