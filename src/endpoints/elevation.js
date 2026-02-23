class Elevation {
    constructor(client, apiKey) {
        this.client = client;
        this.apiKey = apiKey;
    }

    /**
     * Get elevation for a single location.
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    async getElevation(lat, lng) {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            throw new TypeError('Latitude and longitude must be numbers');
        }
        try {
            const { data } = await this.client.get('/places/v1/elevation', {
                params: { location: `${lat},${lng}`, api_key: this.apiKey },
                headers: { 'Accept': 'application/json' },
            });
            return data;
        } catch (error) {
            const errorMessage = error.response
                ? `Elevation API Error: ${error.response.status} - ${error.response.data.message}`
                : `Elevation API Error: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * Get elevations for multiple locations.
     * @param {string[]} locations - Array of "lat,lng" strings (max 25)
     */
    async getMultiElevation(locations) {
        if (!Array.isArray(locations) || locations.length === 0) {
            throw new Error('locations must be a non-empty array of "lat,lng" strings');
        }
        if (locations.length > 25) {
            throw new Error('Maximum 25 locations allowed per request');
        }
        try {
            const { data } = await this.client.post('/places/v1/elevation', { locations }, {
                params: { api_key: this.apiKey },
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            });
            return data;
        } catch (error) {
            const errorMessage = error.response
                ? `Elevation API Error: ${error.response.status} - ${error.response.data.message}`
                : `Elevation API Error: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
}

module.exports = Elevation;
