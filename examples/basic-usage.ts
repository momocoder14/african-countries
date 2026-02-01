import { 
  getAfricaGeoJSON, 
  searchCountries, 
  isLocationInCountry,
  getCountriesByTradeBloc 
} from '../src';

// 1. Get the whole GeoJSON for rendering a map
const geojson = getAfricaGeoJSON();
console.log(`Loaded GeoJSON with ${geojson.features.length} features.`);

// 2. Search for a country
const nigeria = searchCountries('Nigeria')[0];
if (nigeria) {
    console.log(`Nigeria Details: 
    - Capital: ${nigeria.properties.capital}
    - Currency: ${nigeria.properties.currency}
    - Flag: ${nigeria.properties.flag}
    - Bbox: ${nigeria.bbox}`);
}

// 3. Geofencing: Check if a coordinate is in a country
const lagosCoord = { lat: 6.5244, lng: 3.3792 };
const isInNigeria = isLocationInCountry(lagosCoord.lat, lagosCoord.lng, 'Nigeria');
console.log(`Is Lagos in Nigeria? ${isInNigeria}`);

// 4. Trade Blocs: Get all ECOWAS countries
const ecowas = getCountriesByTradeBloc('ECOWAS');
console.log(`There are ${ecowas.length} countries in ECOWAS.`);
console.log(`Some members: ${ecowas.slice(0, 3).map(c => c.properties.name).join(', ')}...`);
