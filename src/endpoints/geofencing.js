class Geofencing {
    constructor(client, apiKey) {
        this.client = client;
        this.apiKey = apiKey;
    }

    async getRequest(endpoint, params = {}) {
        try {
            const { data } = await this.client.get(endpoint, {
                params: { ...params, api_key: this.apiKey },
                headers: { 'Accept': 'application/json' },
            });
            return data;
        } catch (error) {
            const errorMessage = error.response
                ? `Geofencing API Error: ${error.response.status} - ${error.response.data.message}`
                : `Geofencing API Error: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * Create a new geofence.
     * @param {Object} data - { name, type ('polygon'|'circle'), coordinates, radius, status ('active'|'inactive'), projectId }
     */
    async create(geofenceData) {
        if (!geofenceData) throw new Error('geofence data is required');
        try {
            const { data } = await this.client.post('/places/v1/geofence', geofenceData, {
                params: { api_key: this.apiKey },
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            });
            return data;
        } catch (error) {
            const errorMessage = error.response
                ? `Geofencing API Error: ${error.response.status} - ${error.response.data.message}`
                : `Geofencing API Error: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * Update an existing geofence.
     * @param {string} id - Geofence ID
     * @param {Object} data - Updated geofence data
     */
    async update(id, geofenceData) {
        if (!id || !geofenceData) throw new Error('id and geofence data are required');
        try {
            const { data } = await this.client.put(`/places/v1/geofence/${encodeURIComponent(id)}`, geofenceData, {
                params: { api_key: this.apiKey },
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            });
            return data;
        } catch (error) {
            const errorMessage = error.response
                ? `Geofencing API Error: ${error.response.status} - ${error.response.data.message}`
                : `Geofencing API Error: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * Get a geofence by ID.
     * @param {string} id - Geofence ID
     */
    getById(id) {
        if (!id) throw new Error('id is required');
        return this.getRequest(`/places/v1/geofence/${encodeURIComponent(id)}`);
    }

    /**
     * Delete a geofence by ID.
     * @param {string} id - Geofence ID
     */
    async deleteById(id) {
        if (!id) throw new Error('id is required');
        try {
            const { data } = await this.client.delete(`/places/v1/geofence/${encodeURIComponent(id)}`, {
                params: { api_key: this.apiKey },
                headers: { 'Accept': 'application/json' },
            });
            return data;
        } catch (error) {
            const errorMessage = error.response
                ? `Geofencing API Error: ${error.response.status} - ${error.response.data.message}`
                : `Geofencing API Error: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * List geofences for a project.
     * @param {string} projectId - Project ID
     * @param {number} page - Page number
     * @param {number} size - Records per page
     */
    list(projectId, page = 1, size = 10) {
        if (!projectId) throw new Error('projectId is required');
        return this.getRequest('/places/v1/geofences', { projectId, page, size });
    }

    /**
     * Check if coordinates are inside/outside a geofence.
     * @param {string} geofenceId - Geofence ID
     * @param {string} coordinates - lat,lng format
     */
    checkStatus(geofenceId, coordinates) {
        if (!geofenceId || !coordinates) throw new Error('geofenceId and coordinates are required');
        return this.getRequest('/places/v1/geofence/status', { geofenceId, coordinates });
    }
}

module.exports = Geofencing;
