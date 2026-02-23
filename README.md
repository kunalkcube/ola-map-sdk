# Ola Map SDK

Complete Ola Maps API client for **Node.js**. Covers all endpoints — Places, Routing, Roads, Geofencing, Elevation, and Tiles.

## Installation

```bash
npm install ola-map-sdk
```

## Quick Start

```javascript
const OlaMapsClient = require('ola-map-sdk');
// or: import OlaMapsClient from 'ola-map-sdk';

const client = new OlaMapsClient('YOUR_API_KEY');

// Search for places
const results = await client.places.autocomplete('Koramangala, Bangalore');

// Get directions
const route = await client.routing.getDirections(
    { lat: 12.993103, lon: 77.543326 },
    { lat: 12.972006, lon: 77.580085 }
);
```

---

## API Reference

### Places

```javascript
// Autocomplete
const results = await client.places.autocomplete('Bangalore', {
    location: '12.93,77.61', radius: 5000, language: 'en'
});

// Geocode & Reverse Geocode
const geo     = await client.places.geocode('Taj Mahal, Mumbai');
const reverse = await client.places.reverseGeocode(26.115103, 91.703239);

// Place Details
const details    = await client.places.placeDetails('ola-platform:5000039498427');
const advDetails = await client.places.placeDetailsAdvanced('ola-platform:5000039498427');

// Nearby Search
const nearby    = await client.places.nearbySearch('12.93,77.61', { types: 'restaurant', radius: 1000 });
const nearbyAdv = await client.places.nearbySearchAdvanced('12.93,77.61', { types: 'cafe' });

// Text Search
const text = await client.places.textSearch('Cafes in Koramangala');

// Address Validation
const validation = await client.places.addressValidation('7, Lok Kalyan Marg, New Delhi');

// Place Photo
const photo = await client.places.photo('photo_reference_id');
```

### Routing

```javascript
// Directions (with options)
const directions = await client.routing.getDirections(
    { lat: 12.993103, lon: 77.543326 },
    { lat: 12.972006, lon: 77.580085 },
    { mode: 'driving', steps: true, overview: 'full', traffic_metadata: true }
);

// Directions Basic (no traffic)
const basic = await client.routing.getDirectionsBasic(
    { lat: 12.993103, lon: 77.543326 },
    { lat: 12.972006, lon: 77.580085 }
);

// Distance Matrix
const matrix = await client.routing.getDistanceMatrix(
    '12.993,77.543|12.972,77.580', '12.935,77.615', { mode: 'driving' }
);

// Distance Matrix Basic
const matrixBasic = await client.routing.getDistanceMatrixBasic(
    '12.993,77.543', '12.935,77.615'
);

// Route Optimizer
const optimized = await client.routing.routeOptimizer(
    '12.993,77.543|12.972,77.580|12.935,77.615',
    { source: 'first', destination: 'last' }
);

// Fleet Planner
const fleet = await client.routing.fleetPlanner(
    { packages: [...], vehicles: [...] }, 'optimal'
);
```

### Roads

```javascript
const snapped = await client.roads.snapToRoad('12.999,77.673|12.992,77.658', true);
const nearest = await client.roads.nearestRoads('12.999,77.673|12.992,77.658', 'DRIVING', 500);
const speeds  = await client.roads.speedLimits('13.063,77.593|13.063,77.593');
```

### Geofencing

```javascript
// Create
const fence = await client.geofencing.create({
    name: 'Warehouse', type: 'circle', coordinates: [[12.931, 77.615]],
    radius: 100, status: 'active', projectId: 'my-project'
});

// Read, Update, Delete
const get    = await client.geofencing.getById('fence-id');
const update = await client.geofencing.update('fence-id', { name: 'Updated' });
const del    = await client.geofencing.deleteById('fence-id');

// List & Status Check
const list   = await client.geofencing.list('my-project', 1, 10);
const status = await client.geofencing.checkStatus('fence-id', '12.93,77.61');
```

### Elevation

```javascript
const elev  = await client.elevation.getElevation(12.93126, 77.61638);
const multi = await client.elevation.getMultiElevation(['12.93126,77.61638', '12.89731,77.65136']);
```

### Tiles

```javascript
const styles      = await client.tiles.getStyles();
const styleDetail = await client.tiles.getStyleDetail('default-light-standard');
const tileJSON    = await client.tiles.getDataTileJSON('planet');
const pbf         = await client.tiles.getPBFFile('planet', 14, 110, 1010);
const glyphs      = await client.tiles.getFontGlyphs('Noto Sans Bold', 0, 255);

// Static map images
const img  = await client.tiles.getStaticMapByCenter(
    'default-light-standard', 77.61, 12.93, 15, 800, 600, 'png',
    { marker: '77.61,12.93|red' }
);
const bbox = await client.tiles.getStaticMapByBBox(
    'default-light-standard',
    { minx: 77.5, miny: 12.9, maxx: 77.7, maxy: 13.0 }, 800, 600, 'png'
);
const auto      = await client.tiles.getStaticMapAuto('default-light-standard', 800, 600, 'png');
const tileset3d = await client.tiles.get3DTileset();
```

---

## Map Display (with MapLibre GL)

The SDK includes helper methods to simplify MapLibre GL integration. Install `maplibre-gl` alongside:

```bash
npm install maplibre-gl
```

### Using `getMapOptions()` (recommended)

```javascript
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import OlaMapsClient from 'ola-map-sdk';

const client = new OlaMapsClient('YOUR_API_KEY');

// One-liner — handles style URL + API key injection automatically
const map = new maplibregl.Map(client.getMapOptions({
    container: 'map',
    style: 'default-light-standard',
    center: [77.61, 12.93],
    zoom: 14,
}));
```

### Individual helpers

```javascript
// Get the full style URL
client.getStyleURL('default-dark-standard');
// → "https://api.olamaps.io/tiles/vector/v1/styles/default-dark-standard/style.json"

// Get a pre-configured transformRequest function
const transformRequest = client.getTransformRequest();

// Switch styles at runtime
map.setStyle(client.getStyleURL('eclipse-light-standard'));
```

### Available map styles

| Category | Styles |
|---|---|
| **Default Light** | `default-light-lite`, `default-light-standard`, `default-ultra-light-standard`, `default-light-full` + 11 language variants |
| **Default Dark** | `default-dark-lite`, `default-dark-standard`, `default-dark-full`, `default-dark-standard-satellite` + language variants |
| **Eclipse** | `eclipse-light-lite`, `eclipse-light-standard`, `eclipse-light-full`, `eclipse-dark-lite`, `eclipse-dark-standard`, `eclipse-dark-full` |
| **Bolt** | `bolt-light`, `bolt-dark` |
| **Vintage** | `vintage-light`, `vintage-dark` |
| **Earth** | `default-earth-lite`, `default-earth-standard`, `default-earth-full` |
| **OSM** | `positron`, `osm-bright`, `osm-basic`, `dark-matter`, `fiord-color`, `silver-osm` |

---

## License

MIT © Kunal Kongkan Kashyap