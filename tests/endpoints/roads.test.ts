import { describe, expect, it } from 'vitest';
import { OlaMapsClient, OlaValidationError } from '../../src/index.js';
import { createJsonResponse, createMockFetch } from '../helpers.js';

describe('Roads endpoint', () => {
  it('calls snapToRoad, nearestRoads, and speedLimits with validated params', async () => {
    const seen: URL[] = [];
    const mockFetch = createMockFetch((url) => {
      seen.push(new URL(url));
      return createJsonResponse({ status: 'SUCCESS', snapped_points: [], results: [] });
    });

    const client = new OlaMapsClient({ apiKey: 'k', fetch: mockFetch });
    await client.roads.snapToRoad('12.999,77.673|12.992,77.658', true);
    await client.roads.nearestRoads(
      [
        { lat: 12.999, lng: 77.673 },
        { lat: 12.992, lng: 77.658 },
      ],
      'DRIVING',
      500,
    );
    await client.roads.speedLimits('13.063,77.593|13.064,77.594', 'nearestroad');

    expect(seen.map((u) => u.pathname)).toEqual([
      '/routing/v1/snapToRoad',
      '/routing/v1/nearestRoads',
      '/routing/v1/speedLimits',
    ]);
    expect(seen[0]!.searchParams.get('enhancePath')).toBe('true');
    expect(seen[1]!.searchParams.get('mode')).toBe('DRIVING');
    expect(seen[1]!.searchParams.get('radius')).toBe('500');
    expect(seen[2]!.searchParams.get('snapStrategy')).toBe('nearestroad');
  });

  it('enforces point limits (50 / 100 / 50) and enum values', () => {
    const client = new OlaMapsClient({
      apiKey: 'k',
      fetch: createMockFetch(() => createJsonResponse({})),
    });
    const pts51 = Array.from({ length: 51 }, () => '12.93,77.61').join('|');
    const pts101 = Array.from({ length: 101 }, () => '12.93,77.61').join('|');

    expect(() => client.roads.snapToRoad(pts51)).toThrow(OlaValidationError);
    expect(() => client.roads.nearestRoads(pts101, 'DRIVING')).toThrow(OlaValidationError);
    expect(() => client.roads.nearestRoads('12.93,77.61', 'FLYING' as never)).toThrow(
      OlaValidationError,
    );
    expect(() => client.roads.speedLimits(pts51)).toThrow(OlaValidationError);
    expect(() => client.roads.speedLimits('12.93,77.61', 'invalid' as never)).toThrow(
      OlaValidationError,
    );
  });
});
