export interface StreetViewCoverageBBox {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

export interface StreetViewCoverageAltBBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export type StreetViewBBoxInput = StreetViewCoverageBBox | StreetViewCoverageAltBBox;

export interface StreetViewCoverageResponse {
  type?: string;
  coordinates?: unknown[];
  features?: unknown[];
  [key: string]: unknown;
}

export interface StreetViewImageIdOptions {
  /** Optional search radius in meters. */
  radius?: number;
}

export interface StreetViewImageIdResponse {
  imageId: string;
  lat?: number;
  lon?: number;
  distance?: number;
  [key: string]: unknown;
}

export interface StreetViewNeighbor {
  imageId: string;
  bearing?: number;
  lat?: number;
  lon?: number;
  [key: string]: unknown;
}

export interface StreetViewMetadataResponse {
  imageId: string;
  lat: number;
  lon: number;
  bearing?: number;
  imageUrl?: string;
  capturedAt?: string;
  neighbors?: StreetViewNeighbor[];
  [key: string]: unknown;
}
