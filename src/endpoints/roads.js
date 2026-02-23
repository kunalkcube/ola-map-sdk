class Roads {
    constructor(client, apiKey) {
        this.client = client;
        this.apiKey = apiKey;
    }

    async request(endpoint, params = {}) {
        try {
            const { data } = await this.client.get(endpoint, {
                params: { ...params, api_key: this.apiKey },
                headers: { 'Accept': 'application/json' },
            });
            return data;
        } catch (error) {
            const errorMessage = error.response
                ? `Roads API Error: ${error.response.status} - ${error.response.data.message}`
                : `Roads API Error: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * Snap coordinates to the nearest road segments.
     * @param {string} points - Pipe-separated lat,lng pairs (max 50)
     * @param {boolean} [enhancePath=false] - Add intermediate points for road curvature
     */
    snapToRoad(points, enhancePath = false) {
        if (!points) throw new Error('points are required');
        return this.request('/routing/v1/snapToRoad', { points, enhancePath });
    }

    /**
     * Find nearest roads for each coordinate.
     * @param {string} points - Pipe-separated lat,lng pairs (max 100)
     * @param {string} mode - DRIVING, WALKING, BICYCLING, or TRANSIT
     * @param {number} [radius=500] - Search radius in meters
     */
    nearestRoads(points, mode, radius) {
        if (!points || !mode) throw new Error('points and mode are required');
        const params = { points, mode };
        if (radius != null) params.radius = radius;
        return this.request('/routing/v1/nearestRoads', params);
    }

    /**
     * Get speed limits for snapped road segments.
     * @param {string} points - Pipe-separated lat,lng pairs (max 50)
     * @param {string} [snapStrategy='snaptoroad'] - snaptoroad or nearestroad
     */
    speedLimits(points, snapStrategy = 'snaptoroad') {
        if (!points) throw new Error('points are required');
        return this.request('/routing/v1/speedLimits', { points, snapStrategy });
    }
}

module.exports = Roads;
