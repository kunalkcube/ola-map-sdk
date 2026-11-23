import type { CoordinateInput, LatLng } from './common.js';

export interface AutocompleteOptions {
  location?: CoordinateInput;
  radius?: number;
  strictbounds?: boolean;
  language?: string;
  types?: string;
}

export interface PlaceStructuredFormatting {
  main_text: string;
  secondary_text?: string;
  main_text_matched_substrings?: Array<{ offset: number; length: number }>;
  secondary_text_matched_substrings?: Array<{ offset: number; length: number }>;
}

export interface AutocompletePrediction {
  reference?: string;
  types?: string[];
  matched_substrings?: Array<{ offset: number; length: number }>;
  terms?: Array<{ offset: number; value: string }>;
  distance_meters?: number;
  structured_formatting?: PlaceStructuredFormatting;
  description: string;
  geometry?: {
    location: LatLng;
  };
  place_id: string;
  layer?: string[];
}

export interface AutocompleteResponse {
  error_message?: string;
  info_messages?: string[];
  predictions: AutocompletePrediction[];
  status?: string;
}

export interface GeocodeOptions {
  language?: string;
  bounds?: string;
}

export interface AddressComponent {
  types: string[];
  short_name: string;
  long_name: string;
}

export interface GeocodeResult {
  formatted_address: string;
  types?: string[];
  name?: string;
  geometry: {
    viewport?: {
      southwest: LatLng;
      northeast: LatLng;
    };
    location: LatLng;
    location_type?: string;
  };
  address_components?: AddressComponent[];
  plus_code?: {
    compound_code?: string;
    global_code?: string;
  };
  place_id: string;
  layer?: string[];
}

export interface GeocodeResponse {
  geocodingResults: GeocodeResult[];
  status?: string;
}

export interface ReverseGeocodeOptions {
  language?: string;
}

export interface ReverseGeocodeResponse {
  error_message?: string;
  info_messages?: string[];
  results: GeocodeResult[];
  plus_code?: {
    compound_code?: string;
    global_code?: string;
  };
  status?: string;
}

export interface PlaceDetailsResult {
  place_id: string;
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
  address_components?: AddressComponent[];
  geometry?: {
    location: LatLng;
    viewport?: {
      southwest: LatLng;
      northeast: LatLng;
    };
  };
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
    periods?: Array<{
      open?: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
  };
  photos?: Array<{
    photo_reference: string;
    height?: number;
    width?: number;
    html_attributions?: string[];
  }>;
  reviews?: Array<{
    author_name?: string;
    rating?: number;
    text?: string;
    time?: number;
  }>;
  [key: string]: unknown;
}

export interface PlaceDetailsResponse {
  error_message?: string;
  info_messages?: string[];
  html_attributions?: string[];
  result: PlaceDetailsResult;
  status?: string;
}

export type NearbySearchRankBy = 'popular' | 'distance';

export interface NearbySearchOptions {
  /** Search layer filter (e.g. `'venue'`). */
  layers?: string;
  types?: string;
  language?: string;
  radius?: number;
  withCentroid?: boolean;
  rankBy?: NearbySearchRankBy;
  /** Maximum number of results (1–50). */
  limit?: number;
}

export interface NearbySearchResponse {
  error_message?: string;
  info_messages?: string[];
  predictions: AutocompletePrediction[];
  status?: string;
}

export interface TextSearchOptions {
  location?: CoordinateInput;
  radius?: number;
  types?: string;
  size?: number;
}

export interface TextSearchPrediction {
  formatted_address?: string;
  geometry?: {
    location: LatLng;
  };
  place_id: string;
  name?: string;
  types?: string[];
  [key: string]: unknown;
}

export interface TextSearchResponse {
  error_message?: string;
  info_messages?: string[];
  predictions: TextSearchPrediction[];
  status?: string;
}

export interface AddressValidationResponse {
  result?: {
    validated?: boolean;
    validated_address?: string;
    address_components?: AddressComponent[];
    [key: string]: unknown;
  };
  status?: string;
  [key: string]: unknown;
}

export interface PlacePhotoResponse {
  photos?: Array<{
    photoUri?: string;
    [key: string]: unknown;
  }>;
  photoUri?: string;
  status?: string;
  [key: string]: unknown;
}
