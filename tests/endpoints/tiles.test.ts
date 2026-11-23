import { describe, expect, it } from 'vitest';
import { OlaMapsClient, OlaValidationError } from '../../src/index.js';
import { createBinaryResponse, createJsonResponse, createMockFetch } from '../helpers.js';

describe('Tiles & Static Maps endpoint', () => {
  it('serializes multiple markers as repeated marker=... query params and returns ArrayBuffer', async () => {
    const seenUrls: URL[] = [];
    const mockFetch = createMockFetch((url) => {
      seenUrls.push(new URL(url));
      if (url.endsWith('.json') || url.includes('.json?')) {
        return createJsonResponse({ version: 8, sources: {}, layers: [] });
      }
      return createBinaryResponse([137, 80, 78, 71], 'image/png');
    });

    const client = new OlaMapsClient({ apiKey: 'k', fetch: mockFetch });
    await client.tiles.getStyles();
    await client.tiles.getStyleDetail('default-light-standard');
    await client.tiles.getDataTileJSON('planet');
    await client.tiles.get3DTileset();
    const pbf = await client.tiles.getPBFFile('planet', 14, 110, 1010);
    const raster = await client.tiles.getRasterTile('default-light-standard', 14, 11722, 7613);
    const glyphs = await client.tiles.getFontGlyphs('Noto Sans Bold', 0, 255);
    const centerImg = await client.tiles.getStaticMapByCenter(
      'default-light-standard',
      77.61,
      12.93,
      15,
      800,
      600,
      'png',
      { marker: ['77.61,12.93|red', '77.62,12.94|blue'] },
    );
    await client.tiles.getStaticMapByBBox(
      'default-light-standard',
      { minx: 77.5, miny: 12.9, maxx: 77.7, maxy: 13.0 },
      800,
      600,
      'jpg',
    );
    await client.tiles.getStaticMapAuto('default-light-standard', 600, 400, 'png', {
      marker: '77.61,12.93|green',
    });

    expect(pbf).toBeInstanceOf(ArrayBuffer);
    expect(raster).toBeInstanceOf(ArrayBuffer);
    expect(glyphs).toBeInstanceOf(ArrayBuffer);
    expect(centerImg).toBeInstanceOf(ArrayBuffer);

    expect(seenUrls[5]!.pathname).toBe('/tiles/v1/styles/default-light-standard/14/11722/7613.png');

    const staticCenterUrl = seenUrls[7]!;
    expect(staticCenterUrl.searchParams.getAll('marker')).toEqual([
      '77.61,12.93|red',
      '77.62,12.94|blue',
    ]);
    expect(staticCenterUrl.search).not.toContain('marker%5B%5D');
  });

  it('enforces width/height <= 2048, valid format, raster zoom bounds, and marker/path requirement on getStaticMapAuto', () => {
    const client = new OlaMapsClient({
      apiKey: 'k',
      fetch: createMockFetch(() => createJsonResponse({})),
    });

    expect(() => client.tiles.getRasterTile('default-light-standard', 25, 1, 1)).toThrow(
      OlaValidationError,
    );
    expect(() =>
      client.tiles.getRasterTile('default-light-standard', 14, 1, 1, 'webp' as never),
    ).toThrow(OlaValidationError);
    expect(() =>
      client.tiles.getStaticMapByCenter('default-light-standard', 77.6, 12.9, 14, 2049, 600, 'png'),
    ).toThrow(OlaValidationError);
    expect(() =>
      client.tiles.getStaticMapByCenter('default-light-standard', 77.6, 12.9, 25, 800, 600, 'png'),
    ).toThrow(OlaValidationError);
    expect(() =>
      client.tiles.getStaticMapAuto('default-light-standard', 800, 600, 'png', {}),
    ).toThrow(OlaValidationError);
    expect(() =>
      client.tiles.getStaticMapByBBox(
        'default-light-standard',
        { minx: 77.7, miny: 12.9, maxx: 77.5, maxy: 13.0 },
        800,
        600,
        'png',
      ),
    ).toThrow(OlaValidationError);
  });
});
