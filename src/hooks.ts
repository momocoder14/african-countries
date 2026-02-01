/**
 * React hooks for african-countries.
 * Note: These require React as a peer dependency.
 */

import { useState, useMemo } from 'react';
import { getAfricaGeoJSON } from './index';
import { joinDataToGeoJSON, generateSVGMap, MapDimensions } from './utils';
import { FeatureCollection } from 'geojson';

/**
 * A hook to manage African map data and rendering logic in React.
 */
export function useAfricaMap(options: {
  externalData?: Record<string, any>,
  joinKey?: string,
  dimensions?: MapDimensions
} = {}) {
  const { externalData, joinKey = 'alpha3', dimensions = { width: 800, height: 800 } } = options;

  const geojson = useMemo(() => {
    const rawData = getAfricaGeoJSON();
    if (externalData) {
      return joinDataToGeoJSON(rawData, externalData, joinKey);
    }
    return rawData;
  }, [externalData, joinKey]);

  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const svgString = useMemo(() => {
    return generateSVGMap(geojson, dimensions);
  }, [geojson, dimensions]);

  return {
    geojson,
    svgString,
    hoveredCountry,
    setHoveredCountry
  };
}
