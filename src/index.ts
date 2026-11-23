import { OlaMapsClient } from './client.js';

export { OlaMapsClient };
export default OlaMapsClient;

export type { AuthMode } from './core/auth.js';
export { DEFAULT_BASE_URL, DEFAULT_OAUTH_SCOPE, DEFAULT_TOKEN_URL } from './core/auth.js';
export {
  OlaAuthError,
  OlaMapsError,
  type OlaMapsErrorOptions,
  OlaNetworkError,
  OlaRateLimitError,
  OlaTimeoutError,
  OlaValidationError,
  parseRetryAfterMs,
  redactSecrets,
  redactUrl,
} from './core/errors.js';
export {
  formatCoordinateList,
  formatLatLng,
  normalizeCoordinate,
  parseLatLngPair,
} from './core/validate.js';
export { Elevation } from './endpoints/elevation.js';
export { Geofencing } from './endpoints/geofencing.js';
export { Places } from './endpoints/places.js';
export { Roads } from './endpoints/roads.js';
export { Routing } from './endpoints/routing.js';
export { StreetView } from './endpoints/streetview.js';
export { Tiles } from './endpoints/tiles.js';
export type {
  MapLibreMapOptions,
  MapLibreMapOptionsInput,
  MapLibreRequestParameters,
  MapLibreTransformOptions,
  MapLibreTransformRequest,
  OlaMapStyleName,
} from './maplibre/index.js';
export { OLA_MAP_STYLES } from './maplibre/index.js';
export * from './types/index.js';
