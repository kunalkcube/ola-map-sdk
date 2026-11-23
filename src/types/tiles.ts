export type StaticMapFormat = 'png' | 'jpg';

export interface StaticMapOptions {
  /** Single marker string or array of markers serialized as repeated `marker=...` query params. */
  marker?: string | readonly string[];
  /** Encoded polyline or path specification string. */
  path?: string;
}

export interface StaticMapBBox {
  minx: number;
  miny: number;
  maxx: number;
  maxy: number;
}

export interface TileStyleSummary {
  id?: string;
  name: string;
  url?: string;
  version?: number;
  [key: string]: unknown;
}

export interface TileStyleDetail {
  version: number;
  name?: string;
  sources: Record<string, unknown>;
  layers: unknown[];
  sprite?: string;
  glyphs?: string;
  [key: string]: unknown;
}

export interface TileJSONResponse {
  tilejson?: string;
  name?: string;
  tiles?: string[];
  minzoom?: number;
  maxzoom?: number;
  bounds?: [number, number, number, number];
  [key: string]: unknown;
}

export interface Tileset3DResponse {
  asset?: Record<string, unknown>;
  geometricError?: number;
  root?: Record<string, unknown>;
  [key: string]: unknown;
}
