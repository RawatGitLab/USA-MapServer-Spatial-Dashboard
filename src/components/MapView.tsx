import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as L from 'leaflet';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Sliders, 
  Maximize2, 
  Sparkles, 
  Building2, 
  Route, 
  Map as MapIcon, 
  Info, 
  X,
  Compass,
  ArrowUpRight,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  ChoroplethMetric, 
  BasemapType, 
  SelectedFeature,
  StateFeatureProperties,
  CityFeatureProperties,
  HighwayFeatureProperties 
} from '../types';
import { 
  getPopulationColor, 
  getDensityColor, 
  POPULATION_LEGEND_GRADES, 
  DENSITY_LEGEND_GRADES,
  getHighwayColor,
  formatCompactNumber,
  formatNumber,
  STATE_CENTERS
} from '../utils/geoUtils';

interface MapViewProps {
  statesGeoJson: any | null;
  citiesGeoJson: any | null;
  highwaysGeoJson: any | null;
  onSelectFeature: (feature: SelectedFeature) => void;
  selectedFeature: SelectedFeature | null;
  onClearSelection: () => void;
  focusedStateAbbr?: string | null;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onSearchSelect?: (val: string) => void;
  statesList?: { name: string; abbr: string }[];
  citiesList?: { name: string; st: string }[];
}

const BASEMAP_URLS: Record<BasemapType, { url: string; attribution: string }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  }
};

export const MapView: React.FC<MapViewProps> = ({
  statesGeoJson,
  citiesGeoJson,
  highwaysGeoJson,
  onSelectFeature,
  selectedFeature,
  onClearSelection,
  focusedStateAbbr,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  onSearchSelect,
  statesList = [],
  citiesList = []
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const arcgisRasterLayerRef = useRef<L.ImageOverlay | null>(null);
  
  // Vector layer groups
  const statesLayerGroupRef = useRef<L.GeoJSON | null>(null);
  const citiesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const highwaysLayerGroupRef = useRef<L.GeoJSON | null>(null);

  // States - Default to Satellite imagery
  const [basemap, setBasemap] = useState<BasemapType>('satellite');
  const [choroplethMetric, setChoroplethMetric] = useState<ChoroplethMetric>('pop2000');
  
  // Layer visibility toggles
  const [showStatesVector, setShowStatesVector] = useState(true);
  const [showCitiesVector, setShowCitiesVector] = useState(true);
  const [showHighwaysVector, setShowHighwaysVector] = useState(true);
  const [showArcgisDynamic, setShowArcgisDynamic] = useState(false);
  const [arcgisOpacity, setArcgisOpacity] = useState(0.1);
  const [arcgisSublayers, setArcgisSublayers] = useState<number[]>([0, 1, 2, 3]);

  // UI panels
  const [showLayerPanel, setShowLayerPanel] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  const [showLegend, setShowLegend] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [hoveredInfo, setHoveredInfo] = useState<{ title: string; subtitle: string; stats?: string } | null>(null);

  // Search Bar state (moved from header)
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const query = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const updateQuery = externalSetSearchQuery || setInternalSearchQuery;

  // Handle click outside search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = query.trim().length > 1
    ? [
        ...statesList
          .filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.abbr.toLowerCase() === query.toLowerCase())
          .slice(0, 5)
          .map(s => ({ title: s.name, subtitle: `State (${s.abbr})`, type: 'state' as const, value: s.abbr })),
        ...citiesList
          .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5)
          .map(c => ({ title: c.name, subtitle: `City in ${c.st}`, type: 'city' as const, value: `${c.name}, ${c.st}` }))
      ]
    : [];

  const handleSelectSuggestion = (val: string) => {
    onSearchSelect?.(val);
    updateQuery('');
    setIsSearchOpen(false);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [38.5, -96.5],
      zoom: 4,
      minZoom: 3,
      maxZoom: 14,
      zoomControl: false,
    });

    // Add zoom control in top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Initial Base Tile Layer (Satellite)
    const baseTile = L.tileLayer(BASEMAP_URLS.satellite.url, {
      attribution: BASEMAP_URLS.satellite.attribution,
      maxZoom: 18,
    }).addTo(map);
    baseTileLayerRef.current = baseTile;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle Basemap changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (baseTileLayerRef.current) {
      mapRef.current.removeLayer(baseTileLayerRef.current);
    }
    const { url, attribution } = BASEMAP_URLS[basemap];
    baseTileLayerRef.current = L.tileLayer(url, {
      attribution,
      maxZoom: 18,
    }).addTo(mapRef.current);
    
    // Ensure base tile stays behind vectors
    baseTileLayerRef.current.bringToBack();
  }, [basemap]);

  // Update ArcGIS Dynamic MapServer Raster Layer on pan/zoom if enabled
  const updateArcgisRaster = useCallback(() => {
    if (!mapRef.current || !showArcgisDynamic) {
      if (arcgisRasterLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(arcgisRasterLayerRef.current);
        arcgisRasterLayerRef.current = null;
      }
      return;
    }

    const map = mapRef.current;
    const bounds = map.getBounds();
    const size = map.getSize();

    if (size.x <= 0 || size.y <= 0) return;

    // Build ArcGIS MapServer export URL
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    const layersParam = arcgisSublayers.length > 0 ? `show:${arcgisSublayers.join(',')}` : 'show:none';
    const exportUrl = `https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=${Math.round(size.x)},${Math.round(size.y)}&layers=${layersParam}&format=png32&transparent=true&f=image`;

    const imageBounds = L.latLngBounds(bounds.getSouthWest(), bounds.getNorthEast());

    if (arcgisRasterLayerRef.current) {
      map.removeLayer(arcgisRasterLayerRef.current);
    }

    const overlay = L.imageOverlay(exportUrl, imageBounds, {
      opacity: arcgisOpacity,
      interactive: false,
    }).addTo(map);

    arcgisRasterLayerRef.current = overlay;
  }, [showArcgisDynamic, arcgisOpacity, arcgisSublayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (showArcgisDynamic) {
      updateArcgisRaster();
      map.on('moveend', updateArcgisRaster);
      return () => {
        map.off('moveend', updateArcgisRaster);
      };
    } else if (arcgisRasterLayerRef.current) {
      map.removeLayer(arcgisRasterLayerRef.current);
      arcgisRasterLayerRef.current = null;
    }
  }, [showArcgisDynamic, updateArcgisRaster]);

  // Handle States Vector GeoJSON
  useEffect(() => {
    if (!mapRef.current || !statesGeoJson) return;

    if (statesLayerGroupRef.current) {
      mapRef.current.removeLayer(statesLayerGroupRef.current);
      statesLayerGroupRef.current = null;
    }

    if (!showStatesVector) return;

    const styleFeature = (feature: any) => {
      const props = feature?.properties as StateFeatureProperties;
      let fillColor = '#1e293b';
      let fillOpacity = 0.45;

      if (choroplethMetric === 'pop2000' && props?.pop2000) {
        fillColor = getPopulationColor(props.pop2000);
        fillOpacity = 0.65;
      } else if (choroplethMetric === 'pop00_sqmi' && props?.pop00_sqmi) {
        fillColor = getDensityColor(props.pop00_sqmi);
        fillOpacity = 0.65;
      }

      const isSelected = selectedFeature?.type === 'state' && 
        selectedFeature.properties.state_abbr === props?.state_abbr;

      return {
        color: isSelected ? '#38bdf8' : '#64748b',
        weight: isSelected ? 3 : 1,
        opacity: 0.85,
        fillColor,
        fillOpacity: isSelected ? 0.85 : fillOpacity,
      };
    };

    const layer = L.geoJSON(statesGeoJson, {
      style: styleFeature,
      onEachFeature: (feature, l) => {
        const props = feature.properties as StateFeatureProperties;
        
        l.on({
          mouseover: (e) => {
            const target = e.target;
            target.setStyle({
              weight: 2.5,
              color: '#38bdf8',
              fillOpacity: 0.8,
            });
            setHoveredInfo({
              title: `${props.state_name} (${props.state_abbr})`,
              subtitle: `Region: ${props.sub_region}`,
              stats: `Pop: ${formatNumber(props.pop2000)} | Density: ${props.pop00_sqmi} / mi²`
            });
          },
          mouseout: (e) => {
            layer.resetStyle(e.target);
            setHoveredInfo(null);
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            onSelectFeature({
              type: 'state',
              properties: props,
              latLng: [e.latlng.lat, e.latlng.lng]
            });
          }
        });
      }
    }).addTo(mapRef.current);

    statesLayerGroupRef.current = layer;
  }, [statesGeoJson, showStatesVector, choroplethMetric, selectedFeature, onSelectFeature]);

  // Handle Highways Vector GeoJSON
  useEffect(() => {
    if (!mapRef.current || !highwaysGeoJson) return;

    if (highwaysLayerGroupRef.current) {
      mapRef.current.removeLayer(highwaysLayerGroupRef.current);
      highwaysLayerGroupRef.current = null;
    }

    if (!showHighwaysVector) return;

    const layer = L.geoJSON(highwaysGeoJson, {
      style: (feature) => {
        const props = feature?.properties as HighwayFeatureProperties;
        const color = getHighwayColor(props?.type || '');
        const isSelected = selectedFeature?.type === 'highway' && 
          selectedFeature.properties.objectid === props?.objectid;
        
        return {
          color: isSelected ? '#f43f5e' : color,
          weight: isSelected ? 4 : 2,
          opacity: 0.75,
        };
      },
      onEachFeature: (feature, l) => {
        const props = feature.properties as HighwayFeatureProperties;
        l.on({
          mouseover: (e) => {
            e.target.setStyle({ weight: 4, opacity: 1 });
            setHoveredInfo({
              title: props.route ? `Route ${props.route}` : `Highway #${props.rte_num1 || props.objectid}`,
              subtitle: `Type: ${props.type || 'Primary Arterial'}`,
              stats: `Length: ${props.length ? Math.round(props.length) + ' mi' : 'N/A'} ${props.toll_rd === 'Y' ? '• Toll Road' : ''}`
            });
          },
          mouseout: (e) => {
            layer.resetStyle(e.target);
            setHoveredInfo(null);
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            onSelectFeature({
              type: 'highway',
              properties: props,
              latLng: [e.latlng.lat, e.latlng.lng]
            });
          }
        });
      }
    }).addTo(mapRef.current);

    highwaysLayerGroupRef.current = layer;
  }, [highwaysGeoJson, showHighwaysVector, selectedFeature, onSelectFeature]);

  // Handle Cities Vector GeoJSON (CircleMarkers)
  useEffect(() => {
    if (!mapRef.current || !citiesGeoJson) return;

    if (citiesLayerGroupRef.current) {
      mapRef.current.removeLayer(citiesLayerGroupRef.current);
      citiesLayerGroupRef.current = null;
    }

    if (!showCitiesVector) return;

    const group = L.layerGroup();

    const features = citiesGeoJson.features || [];
    features.forEach((feat: any) => {
      const coords = feat.geometry?.coordinates;
      if (!coords || coords.length < 2) return;
      const [lng, lat] = coords;
      const props = feat.properties as CityFeatureProperties;

      const isCapital = props.capital === 'Y';
      const pop = props.pop2000 || 0;
      
      // Radius scaled smoothly by population
      let radius = pop > 1_000_000 ? 7 :
                   pop > 500_000   ? 5.5 :
                   pop > 100_000   ? 4.5 :
                   pop > 50_000    ? 3.5 : 2.5;
      
      if (isCapital) radius += 1.5;

      const fillColor = isCapital ? '#fbbf24' : 
                        pop > 1_000_000 ? '#f43f5e' : 
                        pop > 300_000 ? '#ec4899' : '#38bdf8';

      const circle = L.circleMarker([lat, lng], {
        radius,
        fillColor,
        color: isCapital ? '#78350f' : '#0f172a',
        weight: isCapital ? 2 : 1,
        opacity: 0.9,
        fillOpacity: 0.85,
      });

      circle.on('mouseover', () => {
        circle.setStyle({ weight: 3, color: '#ffffff', fillOpacity: 1 });
        setHoveredInfo({
          title: `${props.areaname}, ${props.st}`,
          subtitle: isCapital ? '⭐ State Capital' : `Class: ${props.class || 'City'}`,
          stats: `Population: ${formatNumber(props.pop2000)}`
        });
      });

      circle.on('mouseout', () => {
        circle.setStyle({
          weight: isCapital ? 2 : 1,
          color: isCapital ? '#78350f' : '#0f172a',
          fillOpacity: 0.85,
        });
        setHoveredInfo(null);
      });

      circle.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectFeature({
          type: 'city',
          properties: props,
          latLng: [lat, lng]
        });
      });

      group.addLayer(circle);
    });

    group.addTo(mapRef.current);
    citiesLayerGroupRef.current = group;
  }, [citiesGeoJson, showCitiesVector, onSelectFeature]);

  // Zoom to state when requested from search or selection
  useEffect(() => {
    if (!mapRef.current || !focusedStateAbbr) return;
    const center = STATE_CENTERS[focusedStateAbbr.toUpperCase()];
    if (center) {
      mapRef.current.flyTo(center, 6, { duration: 1.2 });
    }
  }, [focusedStateAbbr]);

  // Extent navigation helpers
  const handleZoomToContiguousUS = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([38.5, -96.5], 4, { duration: 1 });
  };

  const handleZoomToAlaska = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([64.2008, -152.4937], 4, { duration: 1 });
  };

  const handleZoomToHawaii = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([20.7984, -156.3319], 7, { duration: 1 });
  };

  return (
    <div className="relative w-full h-full min-h-[520px] bg-slate-950 overflow-hidden flex flex-col">
      
      {/* Map Element */}
      <div 
        ref={mapContainerRef} 
        id="arcgis-leaflet-map" 
        className="w-full flex-1 z-0 cursor-grab active:cursor-grabbing border-y border-black dark:border-slate-800"
      />

      {/* Top Left: Extent Presets */}
      <div className="absolute top-3 sm:top-4 left-12 sm:left-14 z-10 flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 backdrop-blur border border-black dark:border-slate-700/80 rounded-lg p-1 shadow-lg">
        <button
          onClick={handleZoomToContiguousUS}
          className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          title="Zoom to Lower 48 States"
        >
          CONUS
        </button>
        <span className="w-px h-3 bg-black/40 dark:bg-slate-700"></span>
        <button
          onClick={handleZoomToAlaska}
          className="px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          title="Zoom to Alaska"
        >
          Alaska
        </button>
        <span className="w-px h-3 bg-black/40 dark:bg-slate-700"></span>
        <button
          onClick={handleZoomToHawaii}
          className="px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          title="Zoom to Hawaii"
        >
          Hawaii
        </button>
      </div>

      {/* Top Left: Floating Search Bar */}
      <div ref={searchContainerRef} className="absolute top-[68px] sm:top-[84px] left-3 sm:left-4 z-20 w-[calc(100%-88px)] sm:w-72 max-w-xs">
        <div className="relative flex items-center bg-slate-900/95 backdrop-blur-md border border-black dark:border-slate-700/80 rounded-xl shadow-xl">
          <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search state, city..."
            value={query}
            onChange={(e) => {
              updateQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 pl-8 pr-7 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl"
          />
          {query && (
            <button
              onClick={() => updateQuery('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {isSearchOpen && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 top-full mt-1.5 w-full bg-slate-900/95 backdrop-blur-md border border-black dark:border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-30">
            <div className="p-2 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-800 px-3 flex items-center justify-between">
              <span>Quick Jump to Location</span>
              <span className="text-[9px] text-slate-500">{filteredSuggestions.length} found</span>
            </div>
            <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-800/40">
              {filteredSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestion(item.value)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 text-xs flex items-center justify-between group transition"
                >
                  <div>
                    <p className="text-slate-100 font-medium group-hover:text-blue-400">{item.title}</p>
                    <p className="text-[10px] text-slate-400">{item.subtitle}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Right: Layer Manager & Basemap Controls */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-2 max-w-[calc(100vw-24px)] sm:max-w-xs w-auto">
        {!showLayerPanel && (
          <button
            onClick={() => setShowLayerPanel(true)}
            className="p-2 sm:px-3 sm:py-2 bg-slate-900/95 backdrop-blur-md border border-black dark:border-slate-700/80 rounded-xl shadow-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 hover:bg-slate-800 transition"
            title="Open Map Layers & Styling"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] sm:text-xs">Layers</span>
            <Sliders className="w-3 h-3 text-slate-400" />
          </button>
        )}

        {showLayerPanel && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-black dark:border-slate-700/80 rounded-xl shadow-xl overflow-hidden text-xs w-[calc(100vw-24px)] sm:w-72">
            
            {/* Header */}
            <div 
              onClick={() => setShowLayerPanel(false)}
              className="p-3 bg-slate-850 flex items-center justify-between cursor-pointer border-b border-slate-800 hover:bg-slate-800/60 transition"
            >
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Map Layers & Styling</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLayerPanel(false);
                }}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-3.5 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto">
              
              {/* Basemap Selection */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Basemap Provider
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['osm', 'satellite', 'light', 'dark'] as BasemapType[]).map((b) => (
                    <button
                      key={b}
                      id={`basemap-btn-${b}`}
                      onClick={() => setBasemap(b)}
                      title={b === 'osm' ? 'OpenStreetMap Standard Tiles' : `${b} basemap`}
                      className={`px-1.5 py-1 rounded text-[11px] font-medium transition ${
                        basemap === b || (b === 'osm' && basemap === 'streets')
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {b === 'osm' ? 'OSM' : b.charAt(0).toUpperCase() + b.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vector Data Layers */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Interactive GIS Overlays
                </label>

                {/* States Layer */}
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/40 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-500"></span>
                    <span className="text-slate-200 font-medium">Layer 2: States</span>
                  </div>
                  <button
                    onClick={() => setShowStatesVector(!showStatesVector)}
                    className={`p-1 rounded transition ${
                      showStatesVector ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500'
                    }`}
                  >
                    {showStatesVector ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Choropleth Mode Selector */}
                {showStatesVector && (
                  <div className="pl-4 pr-1 space-y-1">
                    <span className="text-[10px] text-slate-400">State Fill Metric:</span>
                    <select
                      value={choroplethMetric}
                      onChange={(e) => setChoroplethMetric(e.target.value as ChoroplethMetric)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded p-1.5 focus:outline-none focus:border-blue-500"
                    >
                      <option value="pop2000">Population (2000 Census)</option>
                      <option value="pop00_sqmi">Population Density (per mi²)</option>
                      <option value="none">Outlines Only (Neutral)</option>
                    </select>
                  </div>
                )}

                {/* Cities Layer */}
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/40 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <div>
                      <span className="text-slate-200 font-medium">Layer 0: Cities</span>
                      <span className="text-[10px] text-slate-500 ml-1.5">3.5k</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCitiesVector(!showCitiesVector)}
                    className={`p-1 rounded transition ${
                      showCitiesVector ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500'
                    }`}
                  >
                    {showCitiesVector ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Highways Layer */}
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/40 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 rounded-sm bg-red-500 shadow-sm shadow-red-500/50"></span>
                    <div>
                      <span className="text-black font-medium">Layer 1: Highways</span>
                      <span className="text-[10px] text-slate-500 ml-1.5">679</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHighwaysVector(!showHighwaysVector)}
                    className={`p-1 rounded transition ${
                      showHighwaysVector ? 'text-red-400 bg-red-500/10' : 'text-slate-500'
                    }`}
                  >
                    {showHighwaysVector ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* ArcGIS Dynamic MapServer Raster Layer */}
              <div className="space-y-2 pt-2 border-t border-slate-800 opacity-10">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    ArcGIS Dynamic Raster
                  </label>
                  <button
                    onClick={() => setShowArcgisDynamic(!showArcgisDynamic)}
                    className={`p-1 rounded transition ${
                      showArcgisDynamic ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500'
                    }`}
                    title="Toggle ESRI MapServer live export"
                  >
                    {showArcgisDynamic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showArcgisDynamic && (
                  <div className="space-y-2 pl-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Opacity:</span>
                      <span className="text-slate-200">{Math.round(arcgisOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={arcgisOpacity}
                      onChange={(e) => setArcgisOpacity(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Live export endpoint synced</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Hover Info Card */}
      {hoveredInfo && (
        <div className="absolute top-[132px] left-4 z-10 bg-slate-900/95 backdrop-blur-md border border-black dark:border-slate-700/80 rounded-lg px-3.5 py-2 text-xs shadow-xl pointer-events-none animate-in fade-in duration-100 max-w-sm">
          <p className="font-bold text-slate-100">{hoveredInfo.title}</p>
          <p className="text-[11px] text-slate-400">{hoveredInfo.subtitle}</p>
          {hoveredInfo.stats && (
            <p className="text-[11px] font-mono text-blue-400 mt-0.5">{hoveredInfo.stats}</p>
          )}
        </div>
      )}

      {/* Selected Feature Drawer (Bottom Right Floating) */}
      {selectedFeature && (
        <div className="absolute bottom-3 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-20 bg-slate-900/95 backdrop-blur-md border border-black dark:border-slate-700 rounded-xl p-3.5 sm:p-4 shadow-2xl max-w-full sm:max-w-sm sm:w-80 w-auto animate-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                {selectedFeature.type === 'state' && <MapIcon className="w-4 h-4" />}
                {selectedFeature.type === 'city' && <Building2 className="w-4 h-4" />}
                {selectedFeature.type === 'highway' && <Route className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {selectedFeature.type} Selected
                </span>
                <h4 className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-none">
                  {selectedFeature.properties.state_name || 
                   selectedFeature.properties.areaname || 
                   selectedFeature.properties.route || 
                   'Feature Details'}
                </h4>
              </div>
            </div>
            <button
              onClick={onClearSelection}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-300">
            {selectedFeature.type === 'state' && (
              <>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Abbreviation:</span>
                  <span className="font-semibold text-slate-200">{selectedFeature.properties.state_abbr}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Sub-Region:</span>
                  <span className="text-slate-200">{selectedFeature.properties.sub_region}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Population (2000):</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    {formatNumber(selectedFeature.properties.pop2000)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Density:</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {selectedFeature.properties.pop00_sqmi} / mi²
                  </span>
                </div>
              </>
            )}

            {selectedFeature.type === 'city' && (
              <>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">State:</span>
                  <span className="font-semibold text-slate-200">{selectedFeature.properties.st}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Class:</span>
                  <span className="text-slate-200 capitalize">{selectedFeature.properties.class}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Capital City:</span>
                  <span className="text-amber-400 font-semibold">
                    {selectedFeature.properties.capital === 'Y' ? '⭐ Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Population:</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    {formatNumber(selectedFeature.properties.pop2000)}
                  </span>
                </div>
              </>
            )}

            {selectedFeature.type === 'highway' && (
              <>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Highway Type:</span>
                  <span className="font-semibold text-slate-200">{selectedFeature.properties.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Admin Class:</span>
                  <span className="text-slate-200">{selectedFeature.properties.admn_class || 'Federal / State'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Toll Road:</span>
                  <span className={selectedFeature.properties.toll_rd === 'Y' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {selectedFeature.properties.toll_rd === 'Y' ? 'Toll Highway' : 'Freeway / Non-Toll'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Segment Length:</span>
                  <span className="font-mono text-slate-200">
                    {selectedFeature.properties.length ? `${selectedFeature.properties.length.toFixed(1)} miles` : 'N/A'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Map Legend (Bottom Left) */}
      <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 z-10 bg-slate-900/90 backdrop-blur-md border border-black dark:border-slate-700/80 rounded-xl p-2.5 sm:p-3 shadow-xl max-w-[calc(100vw-24px)] sm:max-w-xs text-xs">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="w-full flex items-center justify-between font-semibold text-slate-200 text-left cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Legend</span>
          </div>
          <span className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5">
            {showLegend ? 'Hide' : 'Show'}
            {showLegend ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </span>
        </button>

        {showLegend && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-2 max-h-44 overflow-y-auto pr-1">
            {/* Choropleth Legend if States vector is active */}
            {showStatesVector && choroplethMetric === 'pop2000' && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium">State Population (2000)</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                  {POPULATION_LEGEND_GRADES.map((grade, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: grade.color }}></span>
                      <span className="text-slate-300 truncate">{grade.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showStatesVector && choroplethMetric === 'pop00_sqmi' && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium">Density (People / mi²)</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                  {DENSITY_LEGEND_GRADES.map((grade, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: grade.color }}></span>
                      <span className="text-slate-300 truncate">{grade.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Symbols summary */}
            <div className="pt-1.5 border-t border-slate-800/80 space-y-1.5 text-[10px]">
              {showCitiesVector && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 border border-amber-800"></span>
                    <span className="text-slate-300">State Capital</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-slate-300">&gt; 1M Metro</span>
                  </div>
                </div>
              )}
              {showHighwaysVector && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-sm bg-red-500"></span>
                    <span className="text-slate-300">Interstate (Red)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 rounded-sm bg-red-400"></span>
                    <span className="text-slate-300">US Route</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
