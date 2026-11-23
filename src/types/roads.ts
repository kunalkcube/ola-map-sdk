export type NearestRoadsMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
export type SnapStrategy = 'snaptoroad' | 'nearestroad';

export interface SnapToRoadOptions {
  enhancePath?: boolean;
}

export interface SnappedPoint {
  location: {
    lat: number;
    lng: number;
  };
  original_index?: number;
  place_id?: string;
}

export interface SnapToRoadResponse {
  status: string;
  snapped_points: SnappedPoint[];
}

export interface NearestRoadsOptions {
  radius?: number;
}

export interface NearestRoadResult {
  originalIndex?: number;
  lat: number;
  lng: number;
  distance?: number;
  status?: string;
}

export interface NearestRoadsResponse {
  status: string;
  results: NearestRoadResult[];
}

export interface SpeedLimitsOptions {
  snapStrategy?: SnapStrategy;
}

export interface SpeedLimitSegment {
  speed_limit?: number;
  speed_limit_unit?: string;
  start_index?: number;
  end_index?: number;
  [key: string]: unknown;
}

export interface SpeedLimitsResponse {
  status: string;
  snapped_points?: SnappedPoint[];
  speed_limits?: SpeedLimitSegment[];
}
