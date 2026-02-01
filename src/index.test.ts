import { describe, it, expect } from 'vitest';
import { 
  getAfricaGeoJSON, 
  getCountryNames, 
  getCountryByCode, 
  getCountriesByRegion, 
  getCountryCapital,
  getCountryCentroid,
  getCountryBBox,
  getCountryFlag,
  searchCountries,
  getCountriesByTradeBloc,
  isLocationInCountry,
  getCountryNeighbors,
  joinDataToGeoJSON,
  getChoroplethColor,
  generateSVGMap,
  toTerminalASCII,
  PALETTES
} from './index';

describe('African Countries Library', () => {
  it('should return all features in the dataset', () => {
    const data = getAfricaGeoJSON();
    expect(data.type).toBe('FeatureCollection');
    expect(data.features.length).toBe(51);
  });

  it('should return a list of country names', () => {
    const names = getCountryNames();
    expect(names).toContain('Nigeria');
    expect(names).toContain('South Africa');
    expect(names).toContain('Egypt');
  });

  it('should find a country by ISO code', () => {
    const nigeria = getCountryByCode('NG');
    expect(nigeria?.properties.name).toBe('Nigeria');
    
    const southAfrica = getCountryByCode('ZAF');
    expect(southAfrica?.properties.name).toBe('South Africa');
  });

  it('should return countries by region', () => {
    const westernAfrica = getCountriesByRegion('Western Africa');
    expect(westernAfrica.length).toBeGreaterThan(0);
    expect(westernAfrica.some(c => c.properties.name === 'Ghana')).toBe(true);
  });

  it('should get country capital', () => {
    expect(getCountryCapital('Kenya')).toBe('Nairobi');
    expect(getCountryCapital('EG')).toBe('Cairo');
  });

  it('should get country centroid', () => {
    const centroid = getCountryCentroid('Nigeria');
    expect(centroid).toBeDefined();
    expect(centroid?.latitude).toBeCloseTo(9.706, 1);
  });

  it('should get country bbox', () => {
    const bbox = getCountryBBox('Nigeria');
    expect(bbox).toBeDefined();
    expect(bbox).toHaveLength(4);
  });

  it('should get country flag', () => {
    expect(getCountryFlag('Nigeria')).toBe('🇳🇬');
  });

  it('should search countries', () => {
    const results = searchCountries('Nig');
    expect(results.some(c => c.properties.name === 'Nigeria')).toBe(true);
    expect(results.some(c => c.properties.name === 'Niger')).toBe(true);
  });

  it('should find countries by trade bloc', () => {
    const ecowas = getCountriesByTradeBloc('ECOWAS');
    expect(ecowas.length).toBeGreaterThan(0);
    expect(ecowas.some(c => c.properties.name === 'Nigeria')).toBe(true);
  });

  it('should check if location is in country', () => {
    // Lagos, Nigeria roughly [6.5, 3.4]
    expect(isLocationInCountry(6.5, 3.4, 'Nigeria')).toBe(true);
    // Cairo, Egypt roughly [30.0, 31.2] - should NOT be in Nigeria
    expect(isLocationInCountry(30.0, 31.2, 'Nigeria')).toBe(false);
  });

  it('should have translations', () => {
    const egypt = getCountryByCode('EG');
    expect(egypt?.properties.translations?.ar).toBe('مصر');
    expect(egypt?.properties.translations?.fr).toBe('Égypte');
  });

  it('should return neighboring countries', () => {
    const neighbors = getCountryNeighbors('Nigeria');
    const names = neighbors.map(c => c.properties.name);
    expect(names).toContain('Benin');
    expect(names).toContain('Cameroon');
    expect(names).toContain('Niger');
  });

  describe('Utilities', () => {
    it('should join external data to GeoJSON', () => {
      const gdpData = {
        'NGA': 440,
        'ZAF': 419,
        'EGY': 404
      };
      const geojson = getAfricaGeoJSON();
      const enriched = joinDataToGeoJSON(geojson, gdpData);
      
      const nigeria = enriched.features.find(f => f.properties && (f.properties as any).alpha3 === 'NGA');
      expect((nigeria?.properties as any).data).toBe(440);
    });

    it('should generate choropleth colors with palettes', () => {
      const color = getChoroplethColor(50, 0, 100, PALETTES.Serengeti);
      expect(color).toMatch(/rgb\(\d+,\d+,\d+\)/);
    });

    it('should generate SVG map with Albers projection', () => {
      const svg = generateSVGMap(getAfricaGeoJSON(), { width: 500, height: 500 }, { projection: 'albers' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('<path');
      expect(svg).toContain('viewBox="0 0 500 500"');
    });

    it('should generate terminal ASCII map', () => {
      const ascii = toTerminalASCII(getAfricaGeoJSON(), 20, 10);
      expect(ascii).toContain('▓');
    });
  });
});
