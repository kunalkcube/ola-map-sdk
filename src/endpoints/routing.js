class Routing {
    constructor(client, apiKey) {
        this.client = client;
        this.apiKey = apiKey;
    }

    async postRequest(endpoint, params) {
        try {
            const { data } = await this.client.post(endpoint, null, {
                params: { ...params, api_key: this.apiKey },
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

    async getRequest(endpoint, params) {
        try {
            const { data } = await this.client.get(endpoint, {
                params: { ...params, api_key: this.apiKey },
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

    getDirections(origin, destination, options = {}) {
        const { lat: originLat, lon: originLon } = origin;
        const { lat: destLat, lon: destLon } = destination;

        const params = {
            origin: `${originLat},${originLon}`,
            destination: `${destLat},${destLon}`,
            alternatives: options.alternatives ?? false,
            steps: options.steps ?? true,
            overview: options.overview ?? 'full',
            language: options.language ?? 'en',
            traffic_metadata: options.traffic_metadata ?? false,
        };
        if (options.waypoints) params.waypoints = options.waypoints;
        if (options.mode) params.mode = options.mode;
        if (options.route_preference) params.route_preference = options.route_preference;

        return this.postRequest('/routing/v1/directions', params);
    }

    getDirectionsBasic(origin, destination, options = {}) {
        const { lat: originLat, lon: originLon } = origin;
        const { lat: destLat, lon: destLon } = destination;

        const params = {
            origin: `${originLat},${originLon}`,
            destination: `${destLat},${destLon}`,
            alternatives: options.alternatives ?? false,
            steps: options.steps ?? true,
            overview: options.overview ?? 'full',
            language: options.language ?? 'en',
        };
        if (options.waypoints) params.waypoints = options.waypoints;
        if (options.route_preference) params.route_preference = options.route_preference;

        return this.postRequest('/routing/v1/directions/basic', params);
    }

    getDistanceMatrix(origins, destinations, options = {}) {
        if (!origins || !destinations) {
            throw new Error('origins and destinations are required');
        }
        const params = {
            origins,
            destinations,
            mode: options.mode ?? 'driving',
        };
        if (options.route_preference) params.route_preference = options.route_preference;

        return this.getRequest('/routing/v1/distanceMatrix', params);
    }

    getDistanceMatrixBasic(origins, destinations, options = {}) {
        if (!origins || !destinations) {
            throw new Error('origins and destinations are required');
        }
        const params = { origins, destinations };
        if (options.route_preference) params.route_preference = options.route_preference;

        return this.getRequest('/routing/v1/distanceMatrix/basic', params);
    }

    routeOptimizer(locations, options = {}) {
        if (!locations) throw new Error('locations are required');

        const params = {
            locations,
            source: options.source ?? 'first',
            destination: options.destination ?? 'last',
            round_trip: options.round_trip ?? false,
            mode: options.mode ?? 'driving',
            steps: options.steps ?? true,
            overview: options.overview ?? 'full',
            language: options.language ?? 'en',
            traffic_metadata: options.traffic_metadata ?? false,
        };
        if (options.route_preference) params.route_preference = options.route_preference;

        return this.postRequest('/routing/v1/routeOptimizer', params);
    }

    async fleetPlanner(inputData, strategy, options = {}) {
        if (!inputData || !strategy) {
            throw new Error('inputData and strategy are required');
        }

        const FormData = require('form-data');
        const form = new FormData();

        if (typeof inputData === 'string') {
            const fs = require('fs');
            form.append('input', fs.createReadStream(inputData));
        } else {
            form.append('input', Buffer.from(JSON.stringify(inputData)), {
                filename: 'input.json',
                contentType: 'application/json',
            });
        }

        const params = {
            strategy,
            api_key: this.apiKey,
        };
        if (options.route_preference) params.route_preference = options.route_preference;

        try {
            const { data } = await this.client.post('/routing/v1/fleetPlanner', form, {
                params,
                headers: { ...form.getHeaders() },
            });
            return data;
        } catch (error) {
            const errorMessage = error.response
                ? `Fleet Planner API Error: ${error.response.status} - ${error.response.data.message}`
                : `Fleet Planner API Error: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
}

module.exports = Routing;
