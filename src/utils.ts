import { FeatureCollection, Feature, Geometry } from 'geojson';
import bbox from '@turf/bbox';

export interface MapDimensions {
  width: number;
  height: number;
  padding?: number;
}

/**
 * Supported map projections.
 */
export type ProjectionType = 'equirectangular' | 'albers';

/**
 * Thematic color palettes for African maps.
 */
export const PALETTES = {
  Serengeti: [[255, 230, 150], [130, 160, 50], [50, 100, 20]] as [number, number, number][],
  Sahara: [[255, 220, 130], [210, 130, 50], [130, 60, 20]] as [number, number, number][],
  Rainforest: [[200, 255, 200], [50, 200, 50], [0, 80, 0]] as [number, number, number][],
  techhive: [[240, 240, 255], [100, 100, 255], [0, 0, 150]] as [number, number, number][]
};

/**
 * Merges external data into GeoJSON features based on a key (default is alpha3 code).
 */
export function joinDataToGeoJSON<T>(
  geojson: FeatureCollection,
  externalData: Record<string, T>,
  joinKey: string = 'alpha3'
): FeatureCollection {
  return {
    ...geojson,
    features: geojson.features.map(feature => {
      const key = (feature.properties as any)[joinKey];
      const data = externalData[key] || externalData[key?.toUpperCase()] || externalData[key?.toLowerCase()];
      return {
        ...feature,
        properties: {
          ...feature.properties,
          data: data !== undefined ? data : null
        }
      };
    })
  };
}

/**
 * Simple linear scale for choropleth colors.
 */
export function getChoroplethColor(
  value: number,
  min: number,
  max: number,
  palette: [number, number, number][] = [[240, 240, 240], [0, 100, 0]]
): string {
  if (max === min) return `rgb(${palette[palette.length - 1].join(',')})`;
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Multi-stop palette interpolation
  const stopCount = palette.length - 1;
  const stopIndex = Math.min(Math.floor(ratio * stopCount), stopCount - 1);
  const stopRatio = (ratio * stopCount) - stopIndex;
  
  const start = palette[stopIndex];
  const end = palette[stopIndex + 1];
  
  const r = Math.round(start[0] + (end[0] - start[0]) * stopRatio);
  const g = Math.round(start[1] + (end[1] - start[1]) * stopRatio);
  const b = Math.round(start[2] + (end[2] - start[2]) * stopRatio);
  return `rgb(${r},${g},${b})`;
}

/**
 * Generates an SVG path 'd' attribute for a GeoJSON geometry.
 */
export function toSVGPath(
  feature: Feature | Geometry,
  { width, height, padding = 10 }: MapDimensions,
  options: { 
    projection?: ProjectionType, 
    customBbox?: [number, number, number, number] 
  } = {}
): string {
  const { projection = 'albers', customBbox } = options;
  
  // Default to African Bounding Box approx if no custom one provided
  // [-20 (W), -35 (S), 55 (E), 40 (N)]
  const targetBbox = customBbox || [-20, -35, 55, 40];
  
  const project = (coord: [number, number]): [number, number] => {
    if (projection === 'albers' && !customBbox) {
      // Simplified Albers only works well for the continent scale without specific centering
      const lat0 = 0, lon0 = 20, phi1 = -20, phi2 = 20;
      const n = (Math.sin(phi1 * Math.PI / 180) + Math.sin(phi2 * Math.PI / 180)) / 2;
      const C = Math.pow(Math.cos(phi1 * Math.PI / 180), 2) + 2 * n * Math.sin(phi1 * Math.PI / 180);
      const rho0 = Math.sqrt(C - 2 * n * Math.sin(lat0 * Math.PI / 180)) / n;
      
      const lon = coord[0], lat = coord[1];
      const theta = n * (lon - lon0) * Math.PI / 180;
      const rho = Math.sqrt(C - 2 * n * Math.sin(lat * Math.PI / 180)) / n;
      
      const x = rho * Math.sin(theta);
      const y = rho0 - rho * Math.cos(theta);
      
      // Map Albers range back to dimensions
      // Approx range for Africa in Albers: X [-0.7, 0.7], Y [-0.8, 0.8]
      const ax = (x + 0.7) / 1.4;
      const ay = (y + 0.8) / 1.6;
      
      return [
        padding + ax * (width - padding * 2),
        height - (padding + ay * (height - padding * 2))
      ];
    } else {
      // Equirectangular / Linear scaling for custom bboxes (zoomed in countries)
      const b = targetBbox;
      const scaleX = (width - padding * 2) / (b[2] - b[0]);
      const scaleY = (height - padding * 2) / (b[3] - b[1]);
      return [
        padding + (coord[0] - b[0]) * scaleX,
        height - (padding + (coord[1] - b[1]) * scaleY)
      ];
    }
  };

  const processGeometry = (geom: any): string => {
    if (geom.type === 'Polygon') {
      return geom.coordinates.map((ring: any) => 
        'M' + ring.map((pt: any) => {
            const p = project(pt as [number, number]);
            return `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
        }).join('L') + 'z'
      ).join(' ');
    }
    if (geom.type === 'MultiPolygon') {
      return geom.coordinates.map((poly: any) => 
        poly.map((ring: any) => 
          'M' + ring.map((pt: any) => {
            const p = project(pt as [number, number]);
            return `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
          }).join('L') + 'z'
        ).join(' ')
      ).join(' ');
    }
    return '';
  };

  const geometry = 'geometry' in feature ? feature.geometry : feature;
  return processGeometry(geometry);
}

/**
 * Generates a full SVG string for Africa GeoJSON.
 */
export function generateSVGMap(
  geojson: FeatureCollection,
  dimensions: MapDimensions,
  options: { 
    colorResolver?: (feature: any) => string,
    projection?: ProjectionType
  } = {}
): string {
  const { colorResolver, projection = 'albers' } = options;
  const paths = geojson.features.map(feature => {
    const d = toSVGPath(feature, dimensions, { projection });
    const fill = colorResolver ? colorResolver(feature) : '#cccccc';
    return `<path d="${d}" fill="${fill}" stroke="#ffffff" stroke-width="0.5">
      <title>${feature.properties?.name}</title>
    </path>`;
  }).join('\n');

  return `<svg viewBox="0 0 ${dimensions.width} ${dimensions.height}" xmlns="http://www.w3.org/2000/svg" style="background: #f0f8ff;">
  <rect width="100%" height="100%" fill="#f0f8ff" />
  ${paths}
</svg>`;
}

/**
 * Generates an SVG map for a single country.
 */
export function generateCountrySVGMap(
  feature: Feature,
  dimensions: MapDimensions,
  options: {
    fill?: string,
    showData?: boolean,
    customLabel?: string
  } = {}
): string {
  const { fill = '#cccccc', showData = false, customLabel } = options;
  const countryBbox = bbox(feature) as [number, number, number, number];
  
  // padding adjustment for centering
  const d = toSVGPath(feature, dimensions, { projection: 'equirectangular', customBbox: countryBbox });
  
  const properties = feature.properties || {};
  const label = customLabel || properties.name;
  const dataValue = showData && (properties as any).data ? `: ${(properties as any).data}` : '';

  return `<svg viewBox="0 0 ${dimensions.width} ${dimensions.height}" xmlns="http://www.w3.org/2000/svg" style="background: #ffffff;">
    <path d="${d}" fill="${fill}" stroke="#333333" stroke-width="1" />
    <text x="50%" y="${dimensions.height - 20}" text-anchor="middle" font-family="Arial" font-size="20" fill="#333333">
      ${label}${dataValue}
    </text>
  </svg>`;
}

/**
 * Returns a simple ASCII map of Africa.
 */
export function toTerminalASCII(
  geojson: FeatureCollection,
  cols: number = 60,
  rows: number = 30
): string {
  // Africa approx bbox: lon [-20, 55], lat [-35, 40]
  const lonMin = -20, lonMax = 55;
  const latMin = -35, latMax = 40;
  
  let map = '';
  // We need booleanPointInPolygon here
  // But to avoid circular or heavy deps in utils, we can pass it or use a simplified check
  // Since we already have @turf/boolean-point-in-polygon in dependencies, let's use it.
  const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
  const { point } = require('@turf/helpers');

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lon = lonMin + (lonMax - lonMin) * (c / cols);
      const lat = latMax - (latMax - latMin) * (r / rows);
      const pt = point([lon, lat]);
      
      const isLand = geojson.features.some(f => booleanPointInPolygon(pt, f));
      map += isLand ? '▓' : ' ';
    }
    map += '\n';
  }
  return map;
}
