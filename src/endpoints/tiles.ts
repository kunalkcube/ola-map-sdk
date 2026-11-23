import { OlaValidationError } from '../core/errors.js';
import type { HttpTransport, QueryParams } from '../core/transport.js';
import {
  assertFiniteNumber,
  assertNonEmptyString,
  assertOneOf,
  assertRange,
} from '../core/validate.js';
import type { RequestOptions } from '../types/common.js';
import type {
  StaticMapBBox,
  StaticMapFormat,
  StaticMapOptions,
  TileJSONResponse,
  TileStyleDetail,
  TileStyleSummary,
  Tileset3DResponse,
} from '../types/tiles.js';

const STATIC_MAP_FORMATS: readonly StaticMapFormat[] = ['png', 'jpg'];

function validateDimensions(width: number, height: number): void {
  assertRange(assertFiniteNumber(width, 'width'), 1, 2048, 'width');
  assertRange(assertFiniteNumber(height, 'height'), 1, 2048, 'height');
}

function buildStaticMapQuery(options: StaticMapOptions): QueryParams {
  const query: QueryParams = {};
  if (options.marker !== undefined) {
    query.marker = options.marker;
  }
  if (options.path !== undefined) {
    query.path = options.path;
  }
  return query;
}

export class Tiles {
  constructor(private readonly transport: HttpTransport) {}

  /**
   * Fetch TileJSON metadata for a vector tile dataset.
   * Note: Vector tile dataset helpers correspond to Ola's vector tile service endpoints.
   */
  getDataTileJSON(datasetName: string, requestOptions?: RequestOptions): Promise<TileJSONResponse> {
    const name = assertNonEmptyString(datasetName, 'datasetName');
    return this.transport.request<TileJSONResponse>({
      method: 'GET',
      path: `/tiles/vector/v1/data/${encodeURIComponent(name)}.json`,
      requestOptions,
    });
  }

  /**
   * Fetch a raw Mapbox Vector Tile (.pbf) as an `ArrayBuffer`.
   */
  getPBFFile(
    datasetName: string,
    z: number,
    x: number,
    y: number,
    requestOptions?: RequestOptions,
  ): Promise<ArrayBuffer> {
    const name = assertNonEmptyString(datasetName, 'datasetName');
    const zoom = assertRange(assertFiniteNumber(z, 'z'), 0, 24, 'z');
    const tileX = assertFiniteNumber(x, 'x');
    const tileY = assertFiniteNumber(y, 'y');

    return this.transport.request<ArrayBuffer>({
      method: 'GET',
      path: `/tiles/vector/v1/data/${encodeURIComponent(name)}/${zoom}/${tileX}/${tileY}.pbf`,
      headers: { Accept: 'application/x-protobuf' },
      responseFormat: 'arrayBuffer',
      requestOptions,
    });
  }

  /**
   * Fetch a raster map tile image (`/{z}/{x}/{y}.{format}`) as an `ArrayBuffer`.
   */
  getRasterTile(
    styleName: string,
    z: number,
    x: number,
    y: number,
    format: StaticMapFormat = 'png',
    requestOptions?: RequestOptions,
  ): Promise<ArrayBuffer> {
    const style = assertNonEmptyString(styleName, 'styleName');
    const zoom = assertRange(assertFiniteNumber(z, 'z'), 0, 24, 'z');
    const tileX = assertFiniteNumber(x, 'x');
    const tileY = assertFiniteNumber(y, 'y');
    const validFormat = assertOneOf(format, STATIC_MAP_FORMATS, 'format');

    return this.transport.request<ArrayBuffer>({
      method: 'GET',
      path: `/tiles/v1/styles/${encodeURIComponent(style)}/${zoom}/${tileX}/${tileY}.${validFormat}`,
      headers: { Accept: validFormat === 'png' ? 'image/png' : 'image/jpeg' },
      responseFormat: 'arrayBuffer',
      requestOptions,
    });
  }

  /**
   * List all available Ola Maps vector styles.
   */
  getStyles(requestOptions?: RequestOptions): Promise<TileStyleSummary[]> {
    return this.transport.request<TileStyleSummary[]>({
      method: 'GET',
      path: '/tiles/vector/v1/styles.json',
      requestOptions,
    });
  }

  /**
   * Fetch a MapLibre Style Specification JSON for a named Ola Maps style.
   */
  getStyleDetail(styleName: string, requestOptions?: RequestOptions): Promise<TileStyleDetail> {
    const name = assertNonEmptyString(styleName, 'styleName');
    return this.transport.request<TileStyleDetail>({
      method: 'GET',
      path: `/tiles/vector/v1/styles/${encodeURIComponent(name)}/style.json`,
      requestOptions,
    });
  }

  /**
   * Fetch SDF font glyph ranges (.pbf) as an `ArrayBuffer`.
   */
  getFontGlyphs(
    fontstack: string,
    start: number,
    end: number,
    requestOptions?: RequestOptions,
  ): Promise<ArrayBuffer> {
    const font = assertNonEmptyString(fontstack, 'fontstack');
    const startCode = assertRange(assertFiniteNumber(start, 'start'), 0, 65535, 'start');
    const endCode = assertRange(assertFiniteNumber(end, 'end'), startCode, 65535, 'end');

    return this.transport.request<ArrayBuffer>({
      method: 'GET',
      path: `/tiles/vector/v1/fonts/${encodeURIComponent(font)}/${startCode}-${endCode}.pbf`,
      headers: { Accept: 'application/x-protobuf' },
      responseFormat: 'arrayBuffer',
      requestOptions,
    });
  }

  /**
   * Fetch a static map image centered on `(lon, lat)` at a given `zoom` (0–23).
   * Width and height must be between 1 and 2048 pixels.
   */
  getStaticMapByCenter(
    styleName: string,
    lon: number,
    lat: number,
    zoom: number,
    width: number,
    height: number,
    format: StaticMapFormat,
    options: StaticMapOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<ArrayBuffer> {
    const style = assertNonEmptyString(styleName, 'styleName');
    const validLon = assertRange(assertFiniteNumber(lon, 'lon'), -180, 180, 'lon');
    const validLat = assertRange(assertFiniteNumber(lat, 'lat'), -90, 90, 'lat');
    const validZoom = assertRange(assertFiniteNumber(zoom, 'zoom'), 0, 23, 'zoom');
    validateDimensions(width, height);
    const validFormat = assertOneOf(format, STATIC_MAP_FORMATS, 'format');

    return this.transport.request<ArrayBuffer>({
      method: 'GET',
      path: `/tiles/v1/styles/${encodeURIComponent(style)}/static/${validLon},${validLat},${validZoom}/${width}x${height}.${validFormat}`,
      query: buildStaticMapQuery(options),
      headers: { Accept: validFormat === 'png' ? 'image/png' : 'image/jpeg' },
      responseFormat: 'arrayBuffer',
      requestOptions,
    });
  }

  /**
   * Fetch a static map image bounded by `{ minx, miny, maxx, maxy }`.
   */
  getStaticMapByBBox(
    styleName: string,
    bbox: StaticMapBBox,
    width: number,
    height: number,
    format: StaticMapFormat,
    options: StaticMapOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<ArrayBuffer> {
    const style = assertNonEmptyString(styleName, 'styleName');
    if (!bbox || typeof bbox !== 'object') {
      throw new OlaValidationError('bbox must be an object with { minx, miny, maxx, maxy }');
    }
    const minx = assertRange(assertFiniteNumber(bbox.minx, 'bbox.minx'), -180, 180, 'bbox.minx');
    const miny = assertRange(assertFiniteNumber(bbox.miny, 'bbox.miny'), -90, 90, 'bbox.miny');
    const maxx = assertRange(assertFiniteNumber(bbox.maxx, 'bbox.maxx'), -180, 180, 'bbox.maxx');
    const maxy = assertRange(assertFiniteNumber(bbox.maxy, 'bbox.maxy'), -90, 90, 'bbox.maxy');
    if (minx >= maxx || miny >= maxy) {
      throw new OlaValidationError('bbox requires minx < maxx and miny < maxy');
    }
    validateDimensions(width, height);
    const validFormat = assertOneOf(format, STATIC_MAP_FORMATS, 'format');

    return this.transport.request<ArrayBuffer>({
      method: 'GET',
      path: `/tiles/v1/styles/${encodeURIComponent(style)}/static/${minx},${miny},${maxx},${maxy}/${width}x${height}.${validFormat}`,
      query: buildStaticMapQuery(options),
      headers: { Accept: validFormat === 'png' ? 'image/png' : 'image/jpeg' },
      responseFormat: 'arrayBuffer',
      requestOptions,
    });
  }

  /**
   * Fetch a static map image with auto-fit bounds.
   * Requires at least one `marker` or `path` in `options`.
   */
  getStaticMapAuto(
    styleName: string,
    width: number,
    height: number,
    format: StaticMapFormat,
    options: StaticMapOptions,
    requestOptions?: RequestOptions,
  ): Promise<ArrayBuffer> {
    const style = assertNonEmptyString(styleName, 'styleName');
    validateDimensions(width, height);
    const validFormat = assertOneOf(format, STATIC_MAP_FORMATS, 'format');

    const hasMarker = Array.isArray(options?.marker)
      ? options.marker.length > 0
      : typeof options?.marker === 'string' && options.marker.trim().length > 0;
    const hasPath = typeof options?.path === 'string' && options.path.trim().length > 0;

    if (!hasMarker && !hasPath) {
      throw new OlaValidationError(
        'getStaticMapAuto requires at least one marker or path option to compute bounds',
      );
    }

    return this.transport.request<ArrayBuffer>({
      method: 'GET',
      path: `/tiles/v1/styles/${encodeURIComponent(style)}/static/auto/${width}x${height}.${validFormat}`,
      query: buildStaticMapQuery(options),
      headers: { Accept: validFormat === 'png' ? 'image/png' : 'image/jpeg' },
      responseFormat: 'arrayBuffer',
      requestOptions,
    });
  }

  /**
   * Fetch the 3D buildings tileset JSON.
   */
  get3DTileset(requestOptions?: RequestOptions): Promise<Tileset3DResponse> {
    return this.transport.request<Tileset3DResponse>({
      method: 'GET',
      path: '/tiles/vector/v1/3dtiles/tileset.json',
      requestOptions,
    });
  }
}
