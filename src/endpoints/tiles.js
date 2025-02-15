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
}

module.exports = Tiles;
