export const MAPSERVER_BASE_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';

export interface QueryLayerOptions {
  where?: string;
  outFields?: string;
  returnGeometry?: boolean;
  orderByFields?: string;
  resultRecordCount?: number;
  format?: 'json' | 'geojson';
  geometry?: string;
  geometryType?: string;
}

export async function fetchMapServerMetadata() {
  const res = await fetch(`${MAPSERVER_BASE_URL}?f=json`);
  if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.statusText}`);
  return res.json();
}

export async function fetchLayerInfo(layerId: number) {
  const res = await fetch(`${MAPSERVER_BASE_URL}/${layerId}?f=json`);
  if (!res.ok) throw new Error(`Failed to fetch layer ${layerId} info`);
  return res.json();
}

export async function queryLayer(layerId: number, options: QueryLayerOptions = {}) {
  const params = new URLSearchParams();
  params.set('where', options.where || '1=1');
  params.set('outFields', options.outFields || '*');
  params.set('returnGeometry', String(options.returnGeometry ?? true));
  params.set('f', options.format || 'json');

  if (options.orderByFields) {
    params.set('orderByFields', options.orderByFields);
  }
  if (options.resultRecordCount) {
    params.set('resultRecordCount', String(options.resultRecordCount));
  }
  if (options.geometry && options.geometryType) {
    params.set('geometry', options.geometry);
    params.set('geometryType', options.geometryType);
    params.set('inSR', '4326');
    params.set('spatialRel', 'esriSpatialRelIntersects');
  }

  const url = `${MAPSERVER_BASE_URL}/${layerId}/query?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Layer query failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function identifyPoint(
  lat: number,
  lng: number,
  mapExtent: [number, number, number, number],
  containerSize: [number, number],
  tolerance = 6
) {
  const params = new URLSearchParams();
  params.set('geometry', `${lng},${lat}`);
  params.set('geometryType', 'esriGeometryPoint');
  params.set('sr', '4326');
  params.set('layers', 'all:0,1,2,3');
  params.set('tolerance', String(tolerance));
  params.set('mapExtent', `${mapExtent[0]},${mapExtent[1]},${mapExtent[2]},${mapExtent[3]}`);
  params.set('imageDisplay', `${containerSize[0]},${containerSize[1]},96`);
  params.set('returnGeometry', 'true');
  params.set('f', 'json');

  const res = await fetch(`${MAPSERVER_BASE_URL}/identify?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Identify failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchCountiesByState(stateName: string) {
  // Sanitize single quotes in stateName
  const safeName = stateName.replace(/'/g, "''");
  return queryLayer(3, {
    where: `state_name = '${safeName}'`,
    outFields: 'objectid,name,state_name,pop2000,pop00_sqmi,area',
    returnGeometry: false,
    orderByFields: 'pop2000 DESC',
    format: 'json',
  });
}

export async function fetchCitiesByState(stateAbbr: string) {
  const safeAbbr = stateAbbr.replace(/'/g, "''");
  return queryLayer(0, {
    where: `st = '${safeAbbr}'`,
    outFields: 'objectid,areaname,class,st,capital,pop2000',
    returnGeometry: false,
    orderByFields: 'pop2000 DESC',
    format: 'json',
  });
}
