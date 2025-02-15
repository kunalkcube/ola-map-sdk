class Routing {
    constructor(client, apiKey) {
        this.client = client;
        this.apiKey = apiKey;
    }

    async getDirections(origin, destination, options = {}) {
        const { lat: originLat, lon: originLon } = origin;
        const { lat: destLat, lon: destLon } = destination;

        const params = {
            api_key: this.apiKey,
            origin: `${originLat},${originLon}`,
            destination: `${destLat},${destLon}`,
            alternatives: options.alternatives ?? false,
            steps: options.steps ?? false,
            overview: options.overview ?? 'full',
            language: options.language ?? 'en',
            traffic_metadata: options.traffic_metadata ?? false,
        };

        try {
            const { data } = await this.client.post('/routing/v1/directions', null, {
                params,
                headers: { 'Accept': 'application/json' },
            });

            return data;
        } catch (error) {
            const errorMessage = error.response
                ? `Routing API Error: ${error.response.status} - ${error.response.data.message}`
                : `Routing API Error: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
}

module.exports = Routing;
