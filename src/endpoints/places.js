class Places {
    constructor(client, apiKey) {
        this.client = client;
        this.apiKey = apiKey;
    }

    async request(endpoint, params) {
        try {
            const { data } = await this.client.get(endpoint, {
                params: { ...params, api_key: this.apiKey }
            });
            return data;
        } catch (error) {
            const errorMessage = error.response
                ? `Error ${error.response.status}: ${error.response.data.message}`
                : `Request failed: ${error.message}`;
            console.error(`Places API request failed: ${errorMessage}`);
            throw new Error(`Places API request failed: ${errorMessage}`);
        }
    }

    autocomplete(input, options = {}) {
        const params = { input };
        if (options.location) params.location = options.location;
        if (options.radius != null) params.radius = options.radius;
        if (options.strictbounds != null) params.strictbounds = options.strictbounds;
        if (options.language) params.language = options.language;
        if (options.types) params.types = options.types;
        return this.request('/places/v1/autocomplete', params);
    }

    geocode(address, language) {
        const params = { address };
        if (language) params.language = language;
        return this.request('/places/v1/geocode', params);
    }

    reverseGeocode(lat, lng, language) {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            throw new TypeError('Latitude and longitude must be numbers');
        }
        const params = { latlng: `${lat},${lng}` };
        if (language) params.language = language;
        return this.request('/places/v1/reverse-geocode', params);
    }

    placeDetails(placeId, language) {
        if (!placeId) throw new Error('place_id is required');
        const params = { place_id: placeId };
        if (language) params.language = language;
        return this.request('/places/v1/details', params);
    }

    placeDetailsAdvanced(placeId, language) {
        if (!placeId) throw new Error('place_id is required');
        const params = { place_id: placeId };
        if (language) params.language = language;
        return this.request('/places/v1/details/advanced', params);
    }

    nearbySearch(location, options = {}) {
        if (!location) throw new Error('location is required (lat,lng format)');
        const params = { location };
        if (options.types) params.types = options.types;
        if (options.language) params.language = options.language;
        if (options.radius != null) params.radius = options.radius;
        if (options.withCentroid != null) params.withCentroid = options.withCentroid;
        if (options.rankBy) params.rankBy = options.rankBy;
        if (options.limit != null) params.limit = options.limit;
        return this.request('/places/v1/nearbysearch', params);
    }

    nearbySearchAdvanced(location, options = {}) {
        if (!location) throw new Error('location is required (lat,lng format)');
        const params = { location };
        if (options.types) params.types = options.types;
        if (options.language) params.language = options.language;
        if (options.radius != null) params.radius = options.radius;
        if (options.withCentroid != null) params.withCentroid = options.withCentroid;
        if (options.rankBy) params.rankBy = options.rankBy;
        if (options.limit != null) params.limit = options.limit;
        return this.request('/places/v1/nearbysearch/advanced', params);
    }

    textSearch(input, options = {}) {
        if (!input) throw new Error('input text is required');
        const params = { input };
        if (options.location) params.location = options.location;
        if (options.radius != null) params.radius = options.radius;
        if (options.types) params.types = options.types;
        if (options.size != null) params.size = options.size;
        return this.request('/places/v1/textsearch', params);
    }

    addressValidation(address) {
        if (!address) throw new Error('address is required');
        return this.request('/places/v1/addressvalidation', { address });
    }

    photo(photoReference) {
        if (!photoReference) throw new Error('photo_reference is required');
        return this.request('/places/v1/photo', { photo_reference: photoReference });
    }
}

module.exports = Places;
