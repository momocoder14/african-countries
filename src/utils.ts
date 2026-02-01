import { FeatureCollection, Feature, Geometry } from 'geojson';

export interface MapDimensions {
  width: number;
  height: number;
  padding?: number;
}

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
  startColor: [number, number, number] = [240, 240, 240], // Light Gray
  endColor: [number, number, number] = [0, 100, 0]      // Dark Green
): string {
  if (max === min) return `rgb(${endColor.join(',')})`;
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio);
  const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio);
  const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio);
  return `rgb(${r},${g},${b})`;
}

/**
 * Generates an SVG path 'd' attribute for a GeoJSON geometry.
 * Projected specifically for the Africa continent.
 */
export function toSVGPath(
  feature: Feature | Geometry,
  { width, height, padding = 10 }: MapDimensions
): string {
  // African Bounding Box approx for projection: [-20 (W), -35 (S), 55 (E), 40 (N)]
  const bbox = [-20, -35, 55, 40];
  const scaleX = (width - padding * 2) / (bbox[2] - bbox[0]);
  const scaleY = (height - padding * 2) / (bbox[3] - bbox[1]);

  const project = (coord: [number, number]): [number, number] => [
    padding + (coord[0] - bbox[0]) * scaleX,
    height - (padding + (coord[1] - bbox[1]) * scaleY) // Invert Y
  ];

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
  colorResolver?: (feature: any) => string
): string {
  const paths = geojson.features.map(feature => {
    const d = toSVGPath(feature, dimensions);
    const fill = colorResolver ? colorResolver(feature) : '#cccccc';
    return `<path d="${d}" fill="${fill}" stroke="#ffffff" stroke-width="0.5">
      <title>${feature.properties?.name}</title>
    </path>`;
  }).join('\n');

  return `<svg viewBox="0 0 ${dimensions.width} ${dimensions.height}" xmlns="http://www.w3.org/2000/svg" style="background: #f0f8ff;">
  ${paths}
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
