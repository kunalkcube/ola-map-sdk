class Tiles {
    constructor(client, apiKey) {
        this.client = client;
        this.apiKey = apiKey;
    }

    async request(endpoint, params = {}, headers = {}, responseType = 'json') {
        try {
            const response = await this.client.get(endpoint, {
                params: { ...params, api_key: this.apiKey },
                headers: { 'Accept': 'application/json', ...headers },
                responseType,
            });
            return response.data;
        } catch (error) {
            const errorMessage = error.response
                ? `Tiles API Error: ${error.response.status} - ${error.response.data.message}`
                : `Tiles API Error: ${error.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    getDataTileJSON(datasetName) {
        return this.request(`/tiles/vector/v1/data/${encodeURIComponent(datasetName)}.json`);
    }

    getPBFFile(datasetName, z, x, y) {
        return this.request(
            `/tiles/vector/v1/data/${encodeURIComponent(datasetName)}/${z}/${x}/${y}.pbf`,
            {},
            { 'Accept': 'application/x-protobuf' },
            'arraybuffer'
        );
    }

    getStyles() {
        return this.request('/tiles/vector/v1/styles.json');
    }

    getStyleDetail(styleName) {
        return this.request(`/tiles/vector/v1/styles/${encodeURIComponent(styleName)}/style.json`);
    }

    getFontGlyphs(fontstack, start, end) {
        return this.request(
            `/tiles/vector/v1/fonts/${encodeURIComponent(fontstack)}/${start}-${end}.pbf`,
            {},
            { 'Accept': 'application/x-protobuf' },
            'arraybuffer'
        );
    }

    /**
     * Get a static map image centered on a specific point.
     * @param {string} styleName - e.g. 'default-light-standard'
     * @param {number} lon - Longitude
     * @param {number} lat - Latitude
     * @param {number} zoom - Zoom level (0-23)
     * @param {number} width - Image width (1-2048)
     * @param {number} height - Image height (1-2048)
     * @param {string} format - 'png' or 'jpg'
     * @param {Object} [options] - { marker, path }
     */
    getStaticMapByCenter(styleName, lon, lat, zoom, width, height, format, options = {}) {
        const endpoint = `/tiles/v1/styles/${encodeURIComponent(styleName)}/static/${lon},${lat},${zoom}/${width}x${height}.${format}`;
        const params = {};
        if (options.marker) params.marker = options.marker;
        if (options.path) params.path = options.path;
        return this.request(endpoint, params, {}, 'arraybuffer');
    }

    /**
     * Get a static map image for a bounding box.
     * @param {string} styleName
     * @param {{ minx: number, miny: number, maxx: number, maxy: number }} bbox
     * @param {number} width
     * @param {number} height
     * @param {string} format
     * @param {Object} [options]
     */
    getStaticMapByBBox(styleName, bbox, width, height, format, options = {}) {
        const { minx, miny, maxx, maxy } = bbox;
        const endpoint = `/tiles/v1/styles/${encodeURIComponent(styleName)}/static/${minx},${miny},${maxx},${maxy}/${width}x${height}.${format}`;
        const params = {};
        if (options.marker) params.marker = options.marker;
        if (options.path) params.path = options.path;
        return this.request(endpoint, params, {}, 'arraybuffer');
    }

    /**
     * Get a static map image with auto-fit bounds.
     * @param {string} styleName
     * @param {number} width
     * @param {number} height
     * @param {string} format
     * @param {Object} [options]
     */
    getStaticMapAuto(styleName, width, height, format, options = {}) {
        const endpoint = `/tiles/v1/styles/${encodeURIComponent(styleName)}/static/auto/${width}x${height}.${format}`;
        const params = {};
        if (options.marker) params.marker = options.marker;
        if (options.path) params.path = options.path;
        return this.request(endpoint, params, {}, 'arraybuffer');
    }

    /**
     * Get 3D tileset JSON.
     */
    get3DTileset() {
        return this.request('/tiles/vector/v1/3dtiles/tileset.json');
    }
}

module.exports = Tiles;
