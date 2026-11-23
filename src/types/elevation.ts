import type { LatLng } from './common.js';

export interface ElevationResult {
  elevation: number;
  location: LatLng;
}

export interface ElevationResponse {
  status?: string;
  elevation?: number;
  location?: LatLng;
  results?: ElevationResult[];
  [key: string]: unknown;
}

export interface MultiElevationResponse {
  status?: string;
  results: ElevationResult[];
  [key: string]: unknown;
}
