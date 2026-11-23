import { AuthManager, type AuthMode, DEFAULT_BASE_URL } from './core/auth.js';
import { OlaValidationError } from './core/errors.js';
import { HttpTransport } from './core/transport.js';
import { Elevation } from './endpoints/elevation.js';
import { Geofencing } from './endpoints/geofencing.js';
import { Places } from './endpoints/places.js';
import { Roads } from './endpoints/roads.js';
import { Routing } from './endpoints/routing.js';
import { StreetView } from './endpoints/streetview.js';
import { Tiles } from './endpoints/tiles.js';
import {
  type MapLibreMapOptions,
  type MapLibreMapOptionsInput,
  type MapLibreTransformRequest,
  type OlaMapStyleName,
  getMapOptions as buildMapOptions,
  getStyleURL as buildStyleURL,
  getTransformRequest as buildTransformRequest,
} from './maplibre/index.js';
import type { OlaMapsClientConfig, OlaMapsClientInput } from './types/common.js';

export class OlaMapsClient {
  readonly places: Places;
  readonly tiles: Tiles;
  readonly routing: Routing;
  readonly roads: Roads;
  readonly geofencing: Geofencing;
  readonly elevation: Elevation;
  readonly streetView: StreetView;

  private readonly auth: AuthManager;
  private readonly transport: HttpTransport;
  private readonly staticAccessToken?: string;

  /**
   * Create an Ola Maps client.
   *
   * Supports both the v1 shorthand (`new OlaMapsClient('YOUR_API_KEY')`) and the
   * v2 configuration object supporting API Key, OAuth 2.0 (`client_credentials`),
   * pre-issued Bearer `accessToken`, or Proxy Mode (`{ baseUrl: '/api/ola-maps' }`).
   */
  constructor(configOrApiKey: OlaMapsClientInput) {
    let config: OlaMapsClientConfig;

    if (typeof configOrApiKey === 'string') {
      if (!configOrApiKey.trim()) {
        throw new OlaValidationError('API key is required.');
      }
      config = { apiKey: configOrApiKey };
    } else if (configOrApiKey && typeof configOrApiKey === 'object') {
      config = configOrApiKey;
    } else {
      throw new OlaValidationError(
        'OlaMapsClient requires an API key string or configuration object.',
      );
    }

    const fetchImpl = config.fetch ?? globalThis.fetch?.bind(globalThis);
    if (!fetchImpl) {
      throw new OlaValidationError(
        'No global fetch implementation found. Use Node 18+ or pass a custom `fetch` in config.',
      );
    }

    this.auth = new AuthManager(config, fetchImpl);
    this.transport = new HttpTransport(config, this.auth, fetchImpl);
    this.staticAccessToken =
      typeof config.accessToken === 'string' ? config.accessToken : undefined;

    this.places = new Places(this.transport);
    this.tiles = new Tiles(this.transport);
    this.routing = new Routing(this.transport);
    this.roads = new Roads(this.transport);
    this.geofencing = new Geofencing(this.transport);
    this.elevation = new Elevation(this.transport);
    this.streetView = new StreetView(this.transport);
  }

  /** Active authentication mode (`'apiKey'`, `'oauth'`, `'accessToken'`, or `'proxy'`). */
  get authMode(): AuthMode {
    return this.auth.mode;
  }

  /** Configured API base URL. */
  get baseUrl(): string {
    return this.transport.baseUrl;
  }

  /**
   * Fetch or return the cached OAuth 2.0 / Bearer access token.
   */
  getAccessToken(forceRefresh = false): Promise<string> {
    return this.auth.getAccessToken(forceRefresh);
  }

  /**
   * Clear any cached in-memory GET responses.
   */
  clearCache(): void {
    this.transport.clearCache();
  }

  // ── MapLibre GL Convenience Helpers ───────────────────────────────

  /**
   * Get the full MapLibre style URL for a named Ola Maps style.
   */
  getStyleURL(styleName: OlaMapStyleName = 'default-light-standard'): string {
    const styleBase = this.auth.mode === 'proxy' ? this.transport.baseUrl : DEFAULT_BASE_URL;
    return buildStyleURL(styleName, styleBase);
  }

  /**
   * Get a host-safe MapLibre `transformRequest` callback.
   * Credentials are strictly restricted to `*.olamaps.io` hosts and never leak to third-party URLs.
   */
  getTransformRequest(): MapLibreTransformRequest {
    if (this.auth.mode === 'proxy') {
      return buildTransformRequest({ proxyBaseUrl: this.transport.baseUrl });
    }
    return buildTransformRequest({
      apiKey: this.auth.getApiKey(),
      accessToken: this.staticAccessToken,
    });
  }

  /**
   * Build a ready-to-use MapLibre GL `Map` options object.
   */
  getMapOptions(options: MapLibreMapOptionsInput = {}): MapLibreMapOptions {
    const authOpts =
      this.auth.mode === 'proxy'
        ? { proxyBaseUrl: this.transport.baseUrl }
        : {
            apiKey: this.auth.getApiKey(),
            accessToken: this.staticAccessToken,
          };

    return buildMapOptions(authOpts, options);
  }
}
