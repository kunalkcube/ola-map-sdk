import type { HttpTransport, QueryParams } from '../core/transport.js';
import {
  assertNonEmptyString,
  assertRange,
  formatLatLng,
  parseLatLngPair,
} from '../core/validate.js';
import type { CoordinateInput, RequestOptions } from '../types/common.js';
import type {
  AddressValidationResponse,
  AutocompleteOptions,
  AutocompleteResponse,
  GeocodeOptions,
  GeocodeResponse,
  NearbySearchOptions,
  NearbySearchResponse,
  PlaceDetailsResponse,
  PlacePhotoResponse,
  ReverseGeocodeOptions,
  ReverseGeocodeResponse,
  TextSearchOptions,
  TextSearchResponse,
} from '../types/places.js';

export class Places {
  constructor(private readonly transport: HttpTransport) {}

  autocomplete(
    input: string,
    options: AutocompleteOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<AutocompleteResponse> {
    const query: QueryParams = {
      input: assertNonEmptyString(input, 'input'),
    };
    if (options.location !== undefined) {
      query.location = formatLatLng(options.location, 'options.location');
    }
    if (options.radius != null) query.radius = options.radius;
    if (options.strictbounds != null) query.strictbounds = options.strictbounds;
    if (options.language) query.language = options.language;
    if (options.types) query.types = options.types;

    return this.transport.request<AutocompleteResponse>({
      method: 'GET',
      path: '/places/v1/autocomplete',
      query,
      requestOptions,
    });
  }

  geocode(
    address: string,
    languageOrOptions?: string | GeocodeOptions,
    requestOptions?: RequestOptions,
  ): Promise<GeocodeResponse> {
    const query: QueryParams = {
      address: assertNonEmptyString(address, 'address'),
    };
    if (typeof languageOrOptions === 'string') {
      if (languageOrOptions) query.language = languageOrOptions;
    } else if (languageOrOptions) {
      if (languageOrOptions.language) query.language = languageOrOptions.language;
      if (languageOrOptions.bounds) query.bounds = languageOrOptions.bounds;
    }

    return this.transport.request<GeocodeResponse>({
      method: 'GET',
      path: '/places/v1/geocode',
      query,
      requestOptions,
    });
  }

  reverseGeocode(
    lat: number | string,
    lng: number | string,
    languageOrOptions?: string | ReverseGeocodeOptions,
    requestOptions?: RequestOptions,
  ): Promise<ReverseGeocodeResponse>;
  reverseGeocode(
    coordinate: Exclude<CoordinateInput, string>,
    languageOrOptions?: string | ReverseGeocodeOptions,
    requestOptions?: RequestOptions,
  ): Promise<ReverseGeocodeResponse>;
  reverseGeocode(
    latOrCoordinate: number | string | Exclude<CoordinateInput, string>,
    lngOrOptions?: number | string | ReverseGeocodeOptions,
    languageOrRequestOptions?: string | ReverseGeocodeOptions | RequestOptions,
    maybeRequestOptions?: RequestOptions,
  ): Promise<ReverseGeocodeResponse> {
    let latlng: string;
    let language: string | undefined;
    let requestOptions: RequestOptions | undefined;

    if (typeof latOrCoordinate === 'object' && latOrCoordinate !== null) {
      latlng = formatLatLng(latOrCoordinate, 'coordinate');
      if (typeof lngOrOptions === 'string') {
        language = lngOrOptions;
      } else if (lngOrOptions && typeof lngOrOptions === 'object') {
        language = lngOrOptions.language;
      }
      requestOptions = languageOrRequestOptions as RequestOptions | undefined;
    } else {
      const parsed = parseLatLngPair(
        latOrCoordinate,
        lngOrOptions as number | string,
        'reverseGeocode',
      );
      latlng = `${parsed.lat},${parsed.lng}`;
      if (typeof languageOrRequestOptions === 'string') {
        language = languageOrRequestOptions;
      } else if (
        languageOrRequestOptions &&
        typeof languageOrRequestOptions === 'object' &&
        'language' in languageOrRequestOptions
      ) {
        language = languageOrRequestOptions.language;
      }
      requestOptions = maybeRequestOptions;
    }

    const query: QueryParams = { latlng };
    if (language) query.language = language;

    return this.transport.request<ReverseGeocodeResponse>({
      method: 'GET',
      path: '/places/v1/reverse-geocode',
      query,
      requestOptions,
    });
  }

  placeDetails(
    placeId: string,
    language?: string,
    requestOptions?: RequestOptions,
  ): Promise<PlaceDetailsResponse> {
    const query: QueryParams = {
      place_id: assertNonEmptyString(placeId, 'placeId'),
    };
    if (language) query.language = language;

    return this.transport.request<PlaceDetailsResponse>({
      method: 'GET',
      path: '/places/v1/details',
      query,
      requestOptions,
    });
  }

  placeDetailsAdvanced(
    placeId: string,
    language?: string,
    requestOptions?: RequestOptions,
  ): Promise<PlaceDetailsResponse> {
    const query: QueryParams = {
      place_id: assertNonEmptyString(placeId, 'placeId'),
    };
    if (language) query.language = language;

    return this.transport.request<PlaceDetailsResponse>({
      method: 'GET',
      path: '/places/v1/details/advanced',
      query,
      requestOptions,
    });
  }

  nearbySearch(
    location: CoordinateInput,
    options: NearbySearchOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<NearbySearchResponse> {
    return this.executeNearbySearch('/places/v1/nearbysearch', location, options, requestOptions);
  }

  nearbySearchAdvanced(
    location: CoordinateInput,
    options: NearbySearchOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<NearbySearchResponse> {
    return this.executeNearbySearch(
      '/places/v1/nearbysearch/advanced',
      location,
      options,
      requestOptions,
    );
  }

  textSearch(
    input: string,
    options: TextSearchOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<TextSearchResponse> {
    const query: QueryParams = {
      input: assertNonEmptyString(input, 'input'),
    };
    if (options.location !== undefined) {
      query.location = formatLatLng(options.location, 'options.location');
    }
    if (options.radius != null) query.radius = options.radius;
    if (options.types) query.types = options.types;
    if (options.size != null) query.size = options.size;

    return this.transport.request<TextSearchResponse>({
      method: 'GET',
      path: '/places/v1/textsearch',
      query,
      requestOptions,
    });
  }

  addressValidation(
    address: string,
    requestOptions?: RequestOptions,
  ): Promise<AddressValidationResponse> {
    return this.transport.request<AddressValidationResponse>({
      method: 'GET',
      path: '/places/v1/addressvalidation',
      query: { address: assertNonEmptyString(address, 'address') },
      requestOptions,
    });
  }

  photo(photoReference: string, requestOptions?: RequestOptions): Promise<PlacePhotoResponse> {
    return this.transport.request<PlacePhotoResponse>({
      method: 'GET',
      path: '/places/v1/photo',
      query: { photo_reference: assertNonEmptyString(photoReference, 'photoReference') },
      requestOptions,
    });
  }

  private executeNearbySearch(
    path: string,
    location: CoordinateInput,
    options: NearbySearchOptions,
    requestOptions?: RequestOptions,
  ): Promise<NearbySearchResponse> {
    const query: QueryParams = {
      location: formatLatLng(location, 'location'),
    };
    if (options.layers) query.layers = options.layers;
    if (options.types) query.types = options.types;
    if (options.language) query.language = options.language;
    if (options.radius != null) query.radius = options.radius;
    if (options.withCentroid != null) query.withCentroid = options.withCentroid;
    if (options.rankBy) query.rankBy = options.rankBy;
    if (options.limit != null) {
      query.limit = assertRange(options.limit, 1, 50, 'options.limit');
    }

    return this.transport.request<NearbySearchResponse>({
      method: 'GET',
      path,
      query,
      requestOptions,
    });
  }
}
