export interface StateFeatureProperties {
  objectid: number;
  state_name: string;
  sub_region: string;
  state_abbr: string;
  pop2000: number;
  pop00_sqmi: number;
  area?: number;
  st_area?: number;
  st_length?: number;
}

export interface CityFeatureProperties {
  objectid: number;
  areaname: string;
  class: string;
  st: string;
  capital: string;
  pop2000: number;
}

export interface HighwayFeatureProperties {
  objectid: number;
  length: number;
  type: string;
  admn_class: string;
  toll_rd: string;
  rte_num1: string;
  rte_num2: string;
  route: string;
}

export interface CountyFeatureProperties {
  objectid?: number;
  name: string;
  state_name: string;
  pop2000: number;
  pop00_sqmi: number;
  area?: number;
}

export interface MapServerMetadata {
  currentVersion: number;
  serviceDescription: string;
  mapName: string;
  spatialReference: {
    wkid: number;
    latestWkid: number;
  };
  layers: {
    id: number;
    name: string;
    parentLayerId: number;
    defaultVisibility: boolean;
    geometryType: string;
    type: string;
  }[];
  capabilities: string;
  supportedQueryFormats: string;
  maxRecordCount: number;
}

export type ChoroplethMetric = 'pop2000' | 'pop00_sqmi' | 'none';

export type BasemapType = 'osm' | 'dark' | 'light' | 'streets' | 'satellite';

export type ActiveTab = 'map' | 'states' | 'cities' | 'highways' | 'counties' | 'api';

export interface SelectedFeature {
  type: 'state' | 'city' | 'highway' | 'county';
  properties: Record<string, any>;
  latLng?: [number, number];
}
