# Ola Map SDK
Ola Map SDK is a Node.js package that provides an easy-to-use interface for interacting with the Ola Maps API. This SDK allows you to perform various operations like geocoding, reverse geocoding, fetching map tiles, and getting routing directions.

## Installation
Install the package using npm:

```bash
npm install ola-map-sdk
```

## Usage
First, you need to require the SDK and create an instance of the OlaMapsClient class with your API key.

```javascript
const OlaMapsClient = require('ola-map-sdk');

const apiKey = 'YOUR_API_KEY';
const client = new OlaMapsClient(apiKey);
```

### Places API
API for accessing geolocation services such as places autocomplete, reverse geocode.

- **Autocomplete** - Provides Autocomplete suggestions for a given substring satisfying the given criteria.

```javascript
try {
    const result = await client.places.autocomplete('Gauhati University');
    console.log('Autocomplete result:', result);
} catch (error) {
    console.error('Error during autocomplete:', error);
}
```

- **Geocode** - Returns the geocoded address based on the provided parameters.

```javascript
try {
    const result = await client.places.geocode('Taj Mahal, Mumbai');
    console.log('Geocode result:', result);
} catch (error) {
    console.error('Error during geocoding:', error);
}
```

- **Reverse Geocode** - Provides information of a place based on the location provided satisfying the given criteria.

```javascript
try {
    const result = await client.places.reverseGeocode(26.115103, 91.703239);
    console.log('Reverse Geocode result:', result);
} catch (error) {
    console.error('Error during reverse geocoding:', error);
}
```

### Direction API

- **Get Directions** - Provides routable path between two or more points. Accepts coordinates in lat,long format.

```javascript
try {
    const result = await client.routing.getDirections(
        { lat: 12.993103152916301, lon: 77.54332622119354 },
        { lat: 12.972006793201695, lon: 77.5800850011884 },
        {
            alternatives: false,
            steps: true,
            overview: 'full',
            language: 'en',
            traffic_metadata: false
        }
    );
    console.log('Directions result:', result);
} catch (error) {
    console.error('Error fetching directions:', error);
}
```


### Tiles API
API for accessing geolocation services such as places autocomplete, reverse geocode, turn by turn directions, map tiles in vector or image format.

- **Get Data TileJSON** - Get array of data's TileJSONs.

```javascript
try {
    const result = await client.tiles.getDataTileJSON('planet');
    console.log('Data TileJSON result:', result);
} catch (error) {
    console.error('Error fetching Data TileJSON:', error);
}
```

- **Get PBF File** - Returns the PBF file for data.

```javascript
try {
    const result = await client.tiles.getPBFFile('planet', 14, 110, 1010);
    console.log('PBF File result:', result);
} catch (error) {
    console.error('Error fetching PBF file:', error);
}
```

- **Get Styles** - Returns the styles for the map.

```javascript
try {
    const result = await client.tiles.getStyles();
    console.log('Styles result:', result);
} catch (error) {
    console.error('Error fetching Styles:', error);
}
```

- **Get Style Detail** - Returns the style detail for the map.

```javascript
try {
    const result = await client.tiles.getStyleDetail('default-light-standard');
    console.log('Style Detail result:', result);
} catch (error) {
    console.error('Error fetching Style Detail:', error);
}
```

- **Get Font Glyphs** - Returns the font glyphs for the map.

```javascript
try {
    const result = await client.tiles.getFontGlyphs('Noto Sans Bold', 0, 255);
    console.log('Font Glyphs result:', result);
} catch (error) {
    console.error('Error fetching font glyphs:', error);
}
```