# african-countries

Enhanced GeoJSON data and utilities for African countries with TypeScript support.

## Features

- **Rich Metadata**: Each country includes ISO codes, region, capital, **currency**, **dialing codes**, and **trade blocs**.
- **Spatial Analysis**: Built-in geofencing to check if coordinates are within a specific country.
- **Centroids & Bounding Boxes**: `centroid` and `bbox` coordinates for map markers and zooming.
- **Flags & i18n**: Flag emojis and country names translated into FR, AR, PT, and SW.
- **Multiple Formats**: Includes TopoJSON and High/Low resolutions.
- **Map Rendering**: Built-in SVG generators and ASCII terminal previews.
- **Data Population**: Helpers to join external data (GDP, pop, etc.) for choropleth maps.
- **CLI Tool**: Powerful terminal interface for data lookup and map rendering.
- **TypeScript Support**: Fully typed interfaces for all properties.

## Installation

```bash
npm install african-countries
```

## CLI Usage

```bash
# List all countries
npx african-countries list

# Find which country a coordinate belongs to
npx african-countries within 6.52 3.37
# Returns: 🇳🇬 Nigeria

# List ECOWAS member states
npx african-countries bloc ECOWAS

# Search for countries
npx african-countries search Nig

# Preview map in terminal
npx african-countries render

# Export SVG map
npx african-countries export-svg > africa.svg
```

## Usage

For more detailed examples, check the [examples/](examples/) folder in the repository.

### Spatial Analysis (Geofencing)

```typescript
import { isLocationInCountry } from 'african-countries';

const isInside = isLocationInCountry(6.5244, 3.3792, 'Nigeria'); 
// true
```

### Economic Data

```typescript
import { getCountriesByTradeBloc } from 'african-countries';

const sadcStates = getCountriesByTradeBloc('SADC');
console.log(sadcStates[0].properties.currency); 
// { code: "...", name: "..." }
```

## API

### Types

- `AfricaFeatureCollection`: GeoJSON FeatureCollection with enriched properties.
- `AfricaCountryProperties`: Property interface (name, alpha2, alpha3, region, capital, centroid, bbox, flag, translations).
- `AfricaRegion`: Union type for African regions.

### Functions

#### `getAfricaGeoJSON()`
Returns the full enriched `FeatureCollection`.

#### `getAfricaTopoJSON()`
Returns high-resolution TopoJSON data.

#### `getAfricaLowResTopoJSON()`
Returns a simplified TopoJSON for faster performance.

#### `isLocationInCountry(lat: number, lng: number, nameOrCode: string)`
Returns `true` if the coordinate is inside the specified country.

#### `getCountriesByTradeBloc(bloc: string)`
Returns countries belonging to a trade bloc (e.g., 'ECOWAS', 'SADC', 'EAC').

#### `getCountryByCode(code: string)`
Finds a country by ISO alpha-2 or alpha-3 code.

#### `getCountryCentroid(nameOrCode: string)`
Returns centroid coordinates.

#### `getCountryBBox(nameOrCode: string)`
Returns bounding box.

#### `getCountryFlag(nameOrCode: string)`
Returns flag emoji.

#### `getCountryNames()`
Returns all country names.

#### `searchCountries(query: string)`
Searches by name, code, or capital.

#### `generateSVGMap(geojson, dimensions, colorResolver?)`
Returns a full SVG string for rendering maps.

#### `joinDataToGeoJSON(geojson, externalData, joinKey?)`
Merges external JS objects into GeoJSON properties for data visualization.

#### `getChoroplethColor(value, min, max, startColor?, endColor?)`
Generates an RGB color for data mapping.

#### `toTerminalASCII(geojson, cols?, rows?)`
Generates a string representing the map in terminal-friendly characters.

## License
MIT

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---
Created with ❤️ for the African tech community.
