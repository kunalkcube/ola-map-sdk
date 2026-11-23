import { describe, expect, it } from 'vitest';
import { OlaMapsClient, OlaValidationError } from '../../src/index.js';
import { createJsonResponse, createMockFetch } from '../helpers.js';

describe('Street View endpoint', () => {
  it('calls getCoverage, getImageId, and getMetadata with Ola API paths and params', async () => {
    const seen: URL[] = [];
    const mockFetch = createMockFetch((url) => {
      seen.push(new URL(url));
      return createJsonResponse({ imageId: 'img-uuid-1', lat: 12.934, lon: 77.613 });
    });

    const client = new OlaMapsClient({ apiKey: 'k', fetch: mockFetch });

    await client.streetView.getCoverage({
      xMin: 77.611,
      yMin: 12.932,
      xMax: 77.615,
      yMax: 12.935,
    });
    await client.streetView.getCoverage({
      minLng: 77.611,
      minLat: 12.932,
      maxLng: 77.615,
      maxLat: 12.935,
    });
    await client.streetView.getImageId(12.9346, 77.6134, { radius: 50 });
    await client.streetView.getImageId({ lat: 12.9346, lng: 77.6134 });
    await client.streetView.getMetadata('896f26d1-4ede-4f7e-baf6-970d6a0914ea');

    expect(seen.map((u) => u.pathname)).toEqual([
      '/sli/v1/streetview/coverage',
      '/sli/v1/streetview/coverage',
      '/sli/streetview/imageId',
      '/sli/streetview/imageId',
      '/sli/streetview/metadata',
    ]);

    expect(seen[0]!.searchParams.get('xMin')).toBe('77.611');
    expect(seen[0]!.searchParams.get('yMax')).toBe('12.935');
    expect(seen[2]!.searchParams.get('lat')).toBe('12.9346');
    expect(seen[2]!.searchParams.get('lon')).toBe('77.6134');
    expect(seen[2]!.searchParams.get('radius')).toBe('50');
    expect(seen[4]!.searchParams.get('imageId')).toBe('896f26d1-4ede-4f7e-baf6-970d6a0914ea');
  });

  it('validates inverted bounding boxes and empty imageId', () => {
    const client = new OlaMapsClient({
      apiKey: 'k',
      fetch: createMockFetch(() => createJsonResponse({})),
    });

    expect(() =>
      client.streetView.getCoverage({ xMin: 77.7, yMin: 12.9, xMax: 77.5, yMax: 13.0 }),
    ).toThrow(OlaValidationError);
    expect(() => client.streetView.getMetadata('')).toThrow(OlaValidationError);
  });
});
