const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Places = require('./endpoints/places');
const Tiles = require('./endpoints/tiles');
const Routing = require('./endpoints/routing');

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
    }
}

module.exports = OlaMapsClient;
