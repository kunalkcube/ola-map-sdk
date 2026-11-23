import {
  type ReactNode,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { OlaMapsClient } from '../client.js';
import type { CoordinateInput, OlaMapsClientInput } from '../types/common.js';
import type {
  AutocompleteOptions,
  AutocompletePrediction,
  AutocompleteResponse,
  GeocodeResult,
  ReverseGeocodeOptions,
  ReverseGeocodeResponse,
} from '../types/places.js';
import type { DirectionsOptions, DirectionsResponse, Route } from '../types/routing.js';

const OlaMapsContext = createContext<OlaMapsClient | null>(null);

export interface OlaMapsProviderProps {
  /** Pass a pre-instantiated `OlaMapsClient` OR `config` to create one automatically. */
  client?: OlaMapsClient;
  /** Client configuration (e.g. `{ baseUrl: '/api/ola-maps' }` or API key string). */
  config?: OlaMapsClientInput;
  children: ReactNode;
}

/**
 * Provide a shared `OlaMapsClient` instance to descendant React components and hooks.
 */
export function OlaMapsProvider({ client, config, children }: OlaMapsProviderProps) {
  const resolvedClient = useMemo(() => {
    if (client) return client;
    if (!config) {
      throw new Error('OlaMapsProvider requires either a `client` or `config` prop.');
    }
    return new OlaMapsClient(config);
  }, [client, config]);

  return createElement(OlaMapsContext.Provider, { value: resolvedClient }, children);
}

/**
 * Access the nearest `OlaMapsClient` provided by `<OlaMapsProvider>`.
 */
export function useOlaMapsClient(): OlaMapsClient {
  const client = useContext(OlaMapsContext);
  if (!client) {
    throw new Error('useOlaMapsClient must be used within an <OlaMapsProvider>.');
  }
  return client;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export interface UseOlaAutocompleteOptions extends AutocompleteOptions {
  /** Debounce delay in milliseconds before firing a search request (default: 250). */
  debounceMs?: number;
  /** Minimum input length before querying Ola Maps (default: 2). */
  minLength?: number;
  /** Disable automatic querying when false (default: true). */
  enabled?: boolean;
  /** Optional explicit client override (defaults to context client). */
  client?: OlaMapsClient;
}

export interface UseOlaAutocompleteResult {
  predictions: AutocompletePrediction[];
  data: AutocompleteResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Debounced Places Autocomplete hook with automatic `AbortController` cancellation
 * on every keystroke and component unmount.
 */
export function useOlaAutocomplete(
  input: string,
  options: UseOlaAutocompleteOptions = {},
): UseOlaAutocompleteResult {
  const contextClient = useContext(OlaMapsContext);
  const activeClient = options.client ?? contextClient;
  if (!activeClient) {
    throw new Error('useOlaAutocomplete requires <OlaMapsProvider> or options.client.');
  }

  const {
    debounceMs = 250,
    minLength = 2,
    enabled = true,
    location,
    radius,
    strictbounds,
    language,
    types,
  } = options;

  const locationKey = typeof location === 'string' ? location : JSON.stringify(location ?? null);
  const locationRef = useRef(location);
  locationRef.current = location;

  const [data, setData] = useState<AutocompleteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const refetch = useCallback(() => {
    setReloadTick((n) => n + 1);
  }, []);

  useEffect(() => {
    void locationKey;
    void reloadTick;

    const trimmed = input.trim();
    if (!enabled || trimmed.length < minLength) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      activeClient.places
        .autocomplete(
          trimmed,
          { location: locationRef.current, radius, strictbounds, language, types },
          { signal: controller.signal },
        )
        .then((res) => {
          if (!controller.signal.aborted) {
            setData(res);
            setError(null);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted || isAbortError(err)) return;
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    activeClient,
    input,
    enabled,
    minLength,
    debounceMs,
    locationKey,
    radius,
    strictbounds,
    language,
    types,
    reloadTick,
  ]);

  return {
    predictions: data?.predictions ?? [],
    data,
    loading,
    error,
    refetch,
  };
}

export interface UseOlaDirectionsOptions extends DirectionsOptions {
  /** Disable automatic querying when false (default: true). */
  enabled?: boolean;
  /** Optional explicit client override (defaults to context client). */
  client?: OlaMapsClient;
}

export interface UseOlaDirectionsResult {
  routes: Route[];
  data: DirectionsResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch turn-by-turn directions reactively with automatic `AbortController` cancellation.
 */
export function useOlaDirections(
  origin: CoordinateInput | null | undefined,
  destination: CoordinateInput | null | undefined,
  options: UseOlaDirectionsOptions = {},
): UseOlaDirectionsResult {
  const contextClient = useContext(OlaMapsContext);
  const activeClient = options.client ?? contextClient;
  if (!activeClient) {
    throw new Error('useOlaDirections requires <OlaMapsProvider> or options.client.');
  }

  const {
    enabled = true,
    alternatives,
    steps,
    overview,
    language,
    traffic_metadata,
    waypoints,
    mode,
    route_preference,
  } = options;

  const originKey = origin == null ? '' : JSON.stringify(origin);
  const destKey = destination == null ? '' : JSON.stringify(destination);
  const waypointsKey = waypoints == null ? '' : JSON.stringify(waypoints);

  const originRef = useRef(origin);
  const destRef = useRef(destination);
  const waypointsRef = useRef(waypoints);
  originRef.current = origin;
  destRef.current = destination;
  waypointsRef.current = waypoints;

  const [data, setData] = useState<DirectionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const refetch = useCallback(() => {
    setReloadTick((n) => n + 1);
  }, []);

  useEffect(() => {
    void reloadTick;

    if (
      !enabled ||
      !originKey ||
      !destKey ||
      originRef.current == null ||
      destRef.current == null
    ) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void waypointsKey;

    activeClient.routing
      .getDirections(
        originRef.current,
        destRef.current,
        {
          alternatives,
          steps,
          overview,
          language,
          traffic_metadata,
          waypoints: waypointsRef.current,
          mode,
          route_preference,
        },
        { signal: controller.signal },
      )
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [
    activeClient,
    enabled,
    originKey,
    destKey,
    alternatives,
    steps,
    overview,
    language,
    traffic_metadata,
    waypointsKey,
    mode,
    route_preference,
    reloadTick,
  ]);

  return {
    routes: data?.routes ?? [],
    data,
    loading,
    error,
    refetch,
  };
}

export interface UseOlaReverseGeocodeOptions extends ReverseGeocodeOptions {
  enabled?: boolean;
  client?: OlaMapsClient;
}

export interface UseOlaReverseGeocodeResult {
  results: GeocodeResult[];
  data: ReverseGeocodeResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Reverse-geocode a coordinate reactively with automatic `AbortController` cancellation.
 */
export function useOlaReverseGeocode(
  coordinate: Exclude<CoordinateInput, string> | null | undefined,
  options: UseOlaReverseGeocodeOptions = {},
): UseOlaReverseGeocodeResult {
  const contextClient = useContext(OlaMapsContext);
  const activeClient = options.client ?? contextClient;
  if (!activeClient) {
    throw new Error('useOlaReverseGeocode requires <OlaMapsProvider> or options.client.');
  }

  const { enabled = true, language } = options;
  const coordKey = coordinate == null ? '' : JSON.stringify(coordinate);
  const coordRef = useRef(coordinate);
  coordRef.current = coordinate;

  const [data, setData] = useState<ReverseGeocodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const refetch = useCallback(() => {
    setReloadTick((n) => n + 1);
  }, []);

  useEffect(() => {
    void reloadTick;

    if (!enabled || !coordKey || coordRef.current == null) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    activeClient.places
      .reverseGeocode(coordRef.current, { language }, { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [activeClient, enabled, coordKey, language, reloadTick]);

  return {
    results: data?.results ?? [],
    data,
    loading,
    error,
    refetch,
  };
}
