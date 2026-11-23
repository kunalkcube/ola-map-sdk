import type { FetchLike, OAuthTokenResponse, OlaMapsClientConfig } from '../types/common.js';
import { OlaAuthError, OlaValidationError } from './errors.js';

export const DEFAULT_BASE_URL = 'https://api.olamaps.io';
export const DEFAULT_TOKEN_URL = 'https://api.olamaps.io/auth/v1/token';
export const DEFAULT_OAUTH_SCOPE = 'openid';
const DEFAULT_TOKEN_REFRESH_BUFFER_MS = 60_000;
const FALLBACK_TOKEN_TTL_SECONDS = 3600;

export type AuthMode = 'apiKey' | 'oauth' | 'accessToken' | 'proxy';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

function isBrowserRuntime(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { window?: unknown }).window !== 'undefined' &&
    typeof (globalThis as { document?: unknown }).document !== 'undefined'
  );
}

export class AuthManager {
  readonly mode: AuthMode;
  private readonly apiKey?: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly scope: string;
  private readonly tokenUrl: string;
  private readonly tokenRefreshBufferMs: number;
  private readonly accessTokenProvider?: string | (() => string | Promise<string>);
  private readonly fetchImpl: FetchLike;

  private cachedToken?: CachedToken;
  private inFlightToken?: Promise<string>;

  constructor(config: OlaMapsClientConfig, fetchImpl: FetchLike) {
    this.fetchImpl = fetchImpl;
    this.scope = config.scope ?? DEFAULT_OAUTH_SCOPE;
    this.tokenUrl = config.tokenUrl ?? DEFAULT_TOKEN_URL;
    this.tokenRefreshBufferMs = config.tokenRefreshBufferMs ?? DEFAULT_TOKEN_REFRESH_BUFFER_MS;

    const hasApiKey = typeof config.apiKey === 'string' && config.apiKey.trim().length > 0;
    const hasClientId = typeof config.clientId === 'string' && config.clientId.trim().length > 0;
    const hasClientSecret =
      typeof config.clientSecret === 'string' && config.clientSecret.trim().length > 0;
    const hasAccessToken =
      (typeof config.accessToken === 'string' && config.accessToken.trim().length > 0) ||
      typeof config.accessToken === 'function';
    const hasCustomBaseUrl =
      typeof config.baseUrl === 'string' &&
      config.baseUrl.trim().length > 0 &&
      config.baseUrl.replace(/\/+$/, '') !== DEFAULT_BASE_URL;

    if (hasClientId !== hasClientSecret) {
      throw new OlaValidationError(
        'Both clientId and clientSecret are required for OAuth 2.0 authentication.',
      );
    }

    if (hasClientId && hasClientSecret) {
      this.mode = 'oauth';
      this.clientId = config.clientId!.trim();
      this.clientSecret = config.clientSecret!.trim();
      if (!config.suppressBrowserWarning && isBrowserRuntime()) {
        console.warn(
          '[ola-map-sdk] Security warning: OAuth clientSecret should not be exposed in browser bundles. Use Proxy Mode ({ baseUrl: "/api/ola-maps" }) with "ola-map-sdk/next" instead.',
        );
      }
    } else if (hasAccessToken) {
      this.mode = 'accessToken';
      this.accessTokenProvider =
        typeof config.accessToken === 'string' ? config.accessToken.trim() : config.accessToken;
    } else if (hasApiKey) {
      this.mode = 'apiKey';
      this.apiKey = config.apiKey!.trim();
    } else if (hasCustomBaseUrl) {
      this.mode = 'proxy';
    } else {
      throw new OlaValidationError(
        'Authentication required: provide apiKey, { clientId, clientSecret }, accessToken, or a custom proxy baseUrl.',
      );
    }
  }

  getApiKey(): string | undefined {
    return this.apiKey;
  }

  invalidateToken(): void {
    this.cachedToken = undefined;
  }

  /**
   * Retrieve a valid OAuth 2.0 or Bearer access token.
   * Uses single-flight deduplication and proactive refresh before expiry.
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    if (this.mode === 'accessToken') {
      if (typeof this.accessTokenProvider === 'function') {
        const token = await this.accessTokenProvider();
        if (!token) {
          throw new OlaAuthError('accessToken provider returned an empty token.');
        }
        return token;
      }
      return this.accessTokenProvider!;
    }

    if (this.mode !== 'oauth') {
      throw new OlaAuthError(
        `getAccessToken() is only available when configured with OAuth 2.0 or accessToken (current mode: ${this.mode}).`,
      );
    }

    if (
      !forceRefresh &&
      this.cachedToken &&
      Date.now() < this.cachedToken.expiresAt - this.tokenRefreshBufferMs
    ) {
      return this.cachedToken.accessToken;
    }

    if (!this.inFlightToken) {
      this.inFlightToken = this.fetchOAuthToken().finally(() => {
        this.inFlightToken = undefined;
      });
    }

    return this.inFlightToken;
  }

  /**
   * Attach authentication to an outgoing request URL / headers.
   */
  async applyAuth(url: URL, headers: Headers, forceRefresh = false): Promise<void> {
    switch (this.mode) {
      case 'apiKey':
        url.searchParams.set('api_key', this.apiKey!);
        break;
      case 'oauth':
      case 'accessToken': {
        const token = await this.getAccessToken(forceRefresh);
        headers.set('Authorization', `Bearer ${token}`);
        break;
      }
      case 'proxy':
        break;
    }
  }

  private async fetchOAuthToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: this.scope,
      client_id: this.clientId!,
      client_secret: this.clientSecret!,
    });

    let response: Response;
    try {
      response = await this.fetchImpl(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: body.toString(),
      });
    } catch (error) {
      throw new OlaAuthError(
        `Failed to reach OAuth token endpoint: ${error instanceof Error ? error.message : String(error)}`,
        { url: this.tokenUrl, cause: error },
      );
    }

    let payload: Partial<OAuthTokenResponse> & { error?: string; error_description?: string };
    try {
      payload = (await response.json()) as Partial<OAuthTokenResponse> & {
        error?: string;
        error_description?: string;
      };
    } catch {
      payload = {};
    }

    if (!response.ok || !payload.access_token) {
      const detail =
        payload.error_description ?? payload.error ?? response.statusText ?? 'Unknown error';
      throw new OlaAuthError(`OAuth token exchange failed (${response.status}): ${detail}`, {
        status: response.status,
        url: this.tokenUrl,
        body: payload,
      });
    }

    const expiresInSeconds =
      typeof payload.expires_in === 'number' && payload.expires_in > 0
        ? payload.expires_in
        : FALLBACK_TOKEN_TTL_SECONDS;

    this.cachedToken = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };

    return payload.access_token;
  }
}
