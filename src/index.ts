import { FeatureCollection, Geometry, Feature } from 'geojson';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import africaGeoJSONData from './data/africa.json';
import africaTopoJSONData from './data/africa.topo.json';
import africaLowResTopoJSONData from './data/africa-low-res.topo.json';

export type AfricaRegion = 'Northern Africa' | 'Western Africa' | 'Middle Africa' | 'Eastern Africa' | 'Southern Africa';

export interface AfricaCountryProperties {
  name: string;
  alpha2: string | null;
  alpha3: string | null;
  region: AfricaRegion;
  capital: string;
  centroid?: {
    latitude: number;
    longitude: number;
  };
  bbox?: [number, number, number, number];
  flag?: string;
  translations?: {
    fr: string;
    ar: string;
    pt: string;
    sw: string;
  };
  currency?: {
    code: string;
    name: string;
  };
  dialingCode?: string;
  tradeBlocs?: string[];
}

export type AfricaFeature = Feature<Geometry, AfricaCountryProperties>;
export type AfricaFeatureCollection = FeatureCollection<Geometry, AfricaCountryProperties>;

export const africaGeoJSON = africaGeoJSONData as AfricaFeatureCollection;
export const africaTopoJSON = africaTopoJSONData;
export const africaLowResTopoJSON = africaLowResTopoJSONData;

/**
 * Returns the GeoJSON data for African countries.
 */
export function getAfricaGeoJSON(): AfricaFeatureCollection {
  return africaGeoJSON;
}

/**
 * Returns the TopoJSON data for African countries.
 */
export function getAfricaTopoJSON(): any {
  return africaTopoJSON;
}

/**
 * Returns a simplified (low-resolution) TopoJSON for faster loading.
 */
export function getAfricaLowResTopoJSON(): any {
  return africaLowResTopoJSON;
}

/**
 * Returns a list of African country names.
 */
export function getCountryNames(): string[] {
  return africaGeoJSON.features.map(feature => feature.properties.name);
}

/**
 * Finds a country by its ISO alpha-2 or alpha-3 code.
 * @param code ISO alpha-2 or alpha-3 code (e.g., 'NG' or 'NGA')
 */
export function getCountryByCode(code: string): AfricaFeature | undefined {
  const upperCode = code.toUpperCase();
  return africaGeoJSON.features.find(
    feature => feature.properties.alpha2 === upperCode || feature.properties.alpha3 === upperCode
  );
}

/**
 * Returns all countries in a specific region.
 * @param region The region to filter by
 */
export function getCountriesByRegion(region: AfricaRegion): AfricaFeature[] {
  return africaGeoJSON.features.filter(feature => feature.properties.region === region);
}

/**
 * Gets the capital city of a country by name or code.
 * @param nameOrCode Country name, alpha-2, or alpha-3 code
 */
export function getCountryCapital(nameOrCode: string): string | undefined {
  const country = getCountryByName(nameOrCode) || getCountryByCode(nameOrCode);
  return country?.properties.capital;
}

/**
 * Gets the centroid (lat/long) of a country.
 * @param nameOrCode Country name, alpha-2, or alpha-3 code
 */
export function getCountryCentroid(nameOrCode: string): { latitude: number; longitude: number } | undefined {
  const country = getCountryByName(nameOrCode) || getCountryByCode(nameOrCode);
  return country?.properties.centroid;
}

/**
 * Gets the bounding box of a country.
 * @param nameOrCode Country name, alpha-2, or alpha-3 code
 * @returns [minLong, minLat, maxLong, maxLat]
 */
export function getCountryBBox(nameOrCode: string): [number, number, number, number] | undefined {
  const country = getCountryByName(nameOrCode) || getCountryByCode(nameOrCode);
  return country?.properties.bbox;
}

/**
 * Gets the flag emoji of a country.
 * @param nameOrCode Country name, alpha-2, or alpha-3 code
 */
export function getCountryFlag(nameOrCode: string): string | undefined {
  const country = getCountryByName(nameOrCode) || getCountryByCode(nameOrCode);
  return country?.properties.flag;
}

/**
 * Checks if a geographic point is within a specific country.
 * @param lat Latitude
 * @param lng Longitude
 * @param nameOrCode Country name, alpha-2, or alpha-3 code
 */
export function isLocationInCountry(lat: number, lng: number, nameOrCode: string): boolean {
  const country = getCountryByName(nameOrCode) || getCountryByCode(nameOrCode);
  if (!country) return false;
  return booleanPointInPolygon(point([lng, lat]), country as any);
}

/**
 * Returns all countries belonging to a specific trade bloc.
 * @param bloc Trade bloc name (e.g., 'ECOWAS', 'SADC', 'EAC', 'COMESA', 'SACU', 'CEMAC', 'ECCAS', 'AMU', 'IGAD')
 */
export function getCountriesByTradeBloc(bloc: string): AfricaFeature[] {
  const upperBloc = bloc.toUpperCase();
  return africaGeoJSON.features.filter(feature => 
    feature.properties.tradeBlocs?.some(b => b.toUpperCase() === upperBloc)
  );
}

/**
 * Finds a country by its name.
 * @param name The name of the country
 */
export function getCountryByName(name: string): AfricaFeature | undefined {
  return africaGeoJSON.features.find(
    feature => feature.properties.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Searches for countries by a query string matching name, code, or capital.
 * @param query Search query
 */
export function searchCountries(query: string): AfricaFeature[] {
  const normalizedQuery = query.toLowerCase();
  return africaGeoJSON.features.filter(feature => {
    const { name, alpha2, alpha3, capital } = feature.properties;
    return (
      name.toLowerCase().includes(normalizedQuery) ||
      (alpha2 && alpha2.toLowerCase() === normalizedQuery) ||
      (alpha3 && alpha3.toLowerCase() === normalizedQuery) ||
      capital.toLowerCase().includes(normalizedQuery)
    );
  });
}

export default africaGeoJSON;
