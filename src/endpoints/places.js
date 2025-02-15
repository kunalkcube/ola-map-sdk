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

    autocomplete(input) {
        return this.request('/places/v1/autocomplete', { input });
    }

    geocode(address) {
        return this.request('/places/v1/geocode', { address });
    }

    reverseGeocode(lat, lng) {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            throw new TypeError('Latitude and longitude must be numbers');
        }
        return this.request('/places/v1/reverse-geocode', { latlng: `${lat},${lng}` });
    }
}

module.exports = Places;
