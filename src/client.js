const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Places = require('./endpoints/places');
const Tiles = require('./endpoints/tiles');
const Routing = require('./endpoints/routing');
const Roads = require('./endpoints/roads');
const Geofencing = require('./endpoints/geofencing');
const Elevation = require('./endpoints/elevation');

class OlaMapsClient {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('API key is required.');
        }

        this.apiKey = apiKey;
        this.client = this.createAxiosClient();

        this.initializeEndpoints();
    }

    createAxiosClient() {
        return axios.create({
            baseURL: 'https://api.olamaps.io',
            headers: {
                'Accept': 'application/json',
                'X-Request-Id': uuidv4(),
                'X-Correlation-Id': uuidv4(),
            },
        });
    }

    initializeEndpoints() {
        this.places = new Places(this.client, this.apiKey);
        this.tiles = new Tiles(this.client, this.apiKey);
        this.routing = new Routing(this.client, this.apiKey);
        this.roads = new Roads(this.client, this.apiKey);
        this.geofencing = new Geofencing(this.client, this.apiKey);
        this.elevation = new Elevation(this.client, this.apiKey);
    }

    // ── Map Helpers ──────────────────────────────────

    /**
     * Get the full style URL for use with MapLibre GL.
     * @param {string} [styleName='default-light-standard']
     * @returns {string}
     */
    getStyleURL(styleName = 'default-light-standard') {
        return `https://api.olamaps.io/tiles/vector/v1/styles/${styleName}/style.json`;
    }

    /**
     * Get a transformRequest function pre-configured with your API key.
     * Pass this directly to MapLibre GL's map options.
     * @returns {Function}
     */
    getTransformRequest() {
        const apiKey = this.apiKey;
        return (url, resourceType) => {
            url = url.replace('app.olamaps.io', 'api.olamaps.io');
            const separator = url.includes('?') ? '&' : '?';
            return { url: `${url}${separator}api_key=${apiKey}`, resourceType };
        };
    }

    /**
     * Get a complete options object for new maplibregl.Map().
     * Just pass the result directly:
     *   const map = new maplibregl.Map(client.getMapOptions({ container: 'map' }));
     *
     * @param {Object} options
     * @param {string|HTMLElement} options.container - DOM element or element ID
     * @param {[number, number]} [options.center=[77.61, 12.93]] - [lng, lat]
     * @param {number} [options.zoom=14] - Zoom level
     * @param {string} [options.style='default-light-standard'] - Ola Maps style name
     * @returns {Object} Ready-to-use MapLibre GL map options
     */
    getMapOptions(options = {}) {
        return {
            container: options.container,
            style: this.getStyleURL(options.style || 'default-light-standard'),
            center: options.center || [77.61, 12.93],
            zoom: options.zoom ?? 14,
            transformRequest: this.getTransformRequest(),
            ...options,
            // Override style again in case user passed style as string name
            ...(typeof options.style === 'string' && !options.style.startsWith('http')
                ? { style: this.getStyleURL(options.style) }
                : {}),
        };
    }
}

module.exports = OlaMapsClient;
