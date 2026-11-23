// @vitest-environment happy-dom

import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode, createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { OlaMapsClient } from '../../src/client.js';
import {
  OlaMapsProvider,
  useOlaAutocomplete,
  useOlaDirections,
  useOlaMapsClient,
  useOlaReverseGeocode,
} from '../../src/react/index.js';
import { createJsonResponse, createMockFetch } from '../helpers.js';

describe('ola-map-sdk/react hooks & provider', () => {
  it('provides OlaMapsClient via OlaMapsProvider and useOlaMapsClient', () => {
    const mockFetch = createMockFetch(() => createJsonResponse({}));
    const client = new OlaMapsClient({ baseUrl: '/api/ola-maps', fetch: mockFetch });

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(OlaMapsProvider, { client, children });

    const { result } = renderHook(() => useOlaMapsClient(), { wrapper });
    expect(result.current).toBe(client);
  });

  it('debounces autocomplete queries and aborts stale in-flight requests', async () => {
    let abortedCount = 0;
    const mockFetch = createMockFetch((url, init) => {
      const q = new URL(url, 'https://app.local').searchParams.get('input') ?? '';
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve(
            createJsonResponse({
              predictions: [{ place_id: `id_${q}`, description: `Match: ${q}` }],
            }),
          );
        }, 30);

        init?.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          abortedCount++;
          const err = new Error('Aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const client = new OlaMapsClient({ baseUrl: '/api/ola-maps', fetch: mockFetch });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(OlaMapsProvider, { client, children });

    const { result, rerender } = renderHook(
      ({ q }) => useOlaAutocomplete(q, { debounceMs: 20, minLength: 2 }),
      {
        wrapper,
        initialProps: { q: 'Ko' },
      },
    );

    // Wait just past debounce so first request starts in-flight
    await act(async () => {
      await new Promise((r) => setTimeout(r, 25));
    });

    // Type again before first request resolves → must abort first request!
    rerender({ q: 'Koramangala' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.predictions[0]?.place_id).toBe('id_Koramangala');
    });

    expect(abortedCount).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('fetches directions via useOlaDirections and reverse geocode via useOlaReverseGeocode', async () => {
    const mockFetch = createMockFetch((url) => {
      if (url.includes('/routing/v1/directions')) {
        return createJsonResponse({
          status: 'SUCCESS',
          routes: [
            {
              summary: 'ORR',
              legs: [
                {
                  distance: 4200,
                  duration: 600,
                  start_location: { lat: 12.93, lng: 77.61 },
                  end_location: { lat: 12.97, lng: 77.59 },
                },
              ],
            },
          ],
        });
      }
      return createJsonResponse({
        status: 'ok',
        results: [
          {
            place_id: 'rev-1',
            formatted_address: 'Koramangala, Bengaluru',
            geometry: { location: { lat: 12.93, lng: 77.61 } },
          },
        ],
      });
    });

    const client = new OlaMapsClient({ baseUrl: '/api/ola-maps', fetch: mockFetch });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(OlaMapsProvider, { client, children });

    const dirHook = renderHook(
      () => useOlaDirections({ lat: 12.93, lng: 77.61 }, { lat: 12.97, lng: 77.59 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(dirHook.result.current.routes).toHaveLength(1);
    });
    expect(dirHook.result.current.routes[0]?.summary).toBe('ORR');

    const revHook = renderHook(() => useOlaReverseGeocode({ lat: 12.93, lng: 77.61 }), {
      wrapper,
    });
    await waitFor(() => {
      expect(revHook.result.current.results).toHaveLength(1);
    });
    expect(revHook.result.current.results[0]?.formatted_address).toBe('Koramangala, Bengaluru');
  });
});
