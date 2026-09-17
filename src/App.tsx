import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Layers, 
  RefreshCw,
  ExternalLink 
} from 'lucide-react';
import { 
  ActiveTab, 
  SelectedFeature, 
  StateFeatureProperties, 
  CityFeatureProperties, 
  HighwayFeatureProperties,
  CountyFeatureProperties 
} from './types';
import { Header } from './components/Header';
import { KpiBar } from './components/KpiBar';
import { MapView } from './components/MapView';
import { StateAnalytics } from './components/StateAnalytics';
import { CitiesExplorer } from './components/CitiesExplorer';
import { HighwaysExplorer } from './components/HighwaysExplorer';
import { CountiesExplorer } from './components/CountiesExplorer';
import { RestApiInspector } from './components/RestApiInspector';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Loaded GIS Data
  const [statesGeoJson, setStatesGeoJson] = useState<any | null>(null);
  const [citiesGeoJson, setCitiesGeoJson] = useState<any | null>(null);
  const [highwaysGeoJson, setHighwaysGeoJson] = useState<any | null>(null);
  const [countiesSummary, setCountiesSummary] = useState<CountyFeatureProperties[]>([]);

  // Selection & Navigation State
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null);
  const [focusedStateAbbr, setFocusedStateAbbr] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load datasets on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAllDatasets() {
      try {
        setLoading(true);
        setLoadError(null);

        // Fetch datasets in parallel
        const [statesRes, citiesRes, highwaysRes, countiesRes] = await Promise.all([
          fetch('/data/states.geojson'),
          fetch('/data/cities.geojson'),
          fetch('/data/highways.geojson'),
          fetch('/data/counties_summary.json')
        ]);

        if (!statesRes.ok) throw new Error('Failed to load States dataset');

        const [statesData, citiesData, highwaysData, countiesData] = await Promise.all([
          statesRes.json(),
          citiesRes.ok ? citiesRes.json() : null,
          highwaysRes.ok ? highwaysRes.json() : null,
          countiesRes.ok ? countiesRes.json() : null
        ]);

        if (isMounted) {
          setStatesGeoJson(statesData);
          setCitiesGeoJson(citiesData);
          setHighwaysGeoJson(highwaysData);

          if (countiesData && countiesData.features) {
            const formattedCounties: CountyFeatureProperties[] = countiesData.features.map((f: any) => ({
              name: f.attributes.name,
              state_name: f.attributes.state_name,
              pop2000: f.attributes.pop2000,
              pop00_sqmi: f.attributes.pop00_sqmi,
            }));
            setCountiesSummary(formattedCounties);
          }

          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err.message || 'Failed to initialize GIS datasets');
          setLoading(false);
        }
      }
    }

    loadAllDatasets();

    return () => {
      isMounted = false;
    };
  }, []);

  // Extracted States List for Tables & Autocomplete
  const statesList = useMemo<StateFeatureProperties[]>(() => {
    if (!statesGeoJson || !statesGeoJson.features) return [];
    return statesGeoJson.features
      .map((f: any) => f.properties as StateFeatureProperties)
      .filter((s: any) => s && s.state_name);
  }, [statesGeoJson]);

  // States simple name/abbr list for dropdowns
  const statesLookup = useMemo(() => {
    return statesList.map(s => ({ name: s.state_name, abbr: s.state_abbr })).sort((a, b) => a.name.localeCompare(b.name));
  }, [statesList]);

  // Extracted Cities List
  const citiesList = useMemo<CityFeatureProperties[]>(() => {
    if (!citiesGeoJson || !citiesGeoJson.features) return [];
    return citiesGeoJson.features
      .map((f: any) => f.properties as CityFeatureProperties)
      .filter((c: any) => c && c.areaname);
  }, [citiesGeoJson]);

  // Extracted Highways List
  const highwaysList = useMemo<HighwayFeatureProperties[]>(() => {
    if (!highwaysGeoJson || !highwaysGeoJson.features) return [];
    return highwaysGeoJson.features
      .map((f: any) => f.properties as HighwayFeatureProperties)
      .filter((h: any) => h && h.objectid);
  }, [highwaysGeoJson]);

  // Search/Autocomplete Selection Handler
  const handleSearchSelect = (val: string) => {
    // Check if it's a state abbreviation or name
    const matchingState = statesList.find(
      s => s.state_abbr.toLowerCase() === val.toLowerCase() || s.state_name.toLowerCase() === val.toLowerCase()
    );

    if (matchingState) {
      setFocusedStateAbbr(matchingState.state_abbr);
      setSelectedFeature({
        type: 'state',
        properties: matchingState,
      });
      setActiveTab('map');
      return;
    }

    // Check if it's a city
    const [cityName] = val.split(',');
    const matchingCity = citiesList.find(
      c => c.areaname.toLowerCase() === cityName.trim().toLowerCase()
    );

    if (matchingCity) {
      setFocusedStateAbbr(matchingCity.st);
      setSelectedFeature({
        type: 'city',
        properties: matchingCity,
      });
      setActiveTab('map');
      return;
    }
  };

  // Zoom to state action from any view
  const handleZoomToState = (stateAbbr: string) => {
    const s = statesList.find(item => item.state_abbr === stateAbbr);
    setFocusedStateAbbr(stateAbbr);
    if (s) {
      setSelectedFeature({
        type: 'state',
        properties: s,
      });
    }
    setActiveTab('map');
  };

  // Fly to city action
  const handleFlyToCity = (city: CityFeatureProperties) => {
    setFocusedStateAbbr(city.st);
    setSelectedFeature({
      type: 'city',
      properties: city,
    });
    setActiveTab('map');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        onSearchSelect={handleSearchSelect}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statesList={statesLookup}
        citiesList={citiesList.map(c => ({ name: c.areaname, st: c.st }))}
      />

      {/* KPI Stats Strip */}
      <KpiBar
        states={statesList}
        totalCitiesCount={3557}
        totalHighwaysCount={highwaysList.length || 679}
        totalCountiesCount={3141}
        onStateSelect={handleZoomToState}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[450px]">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4 animate-pulse">
              <Layers className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm mb-1">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Connecting to ArcGIS MapServer & loading spatial features...</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Parsing 51 states, 3,557 cities, and 679 highway corridors from sampleserver6.arcgisonline.com
            </p>
          </div>
        ) : loadError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[450px]">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-4 text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Unable to Load MapServer Datasets</h3>
            <p className="text-xs text-slate-400 max-w-md mb-4">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {activeTab === 'map' && (
              <div className="flex-1 w-full h-[calc(100vh-140px)] min-h-[550px]">
                <MapView
                  statesGeoJson={statesGeoJson}
                  citiesGeoJson={citiesGeoJson}
                  highwaysGeoJson={highwaysGeoJson}
                  onSelectFeature={setSelectedFeature}
                  selectedFeature={selectedFeature}
                  onClearSelection={() => setSelectedFeature(null)}
                  focusedStateAbbr={focusedStateAbbr}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSearchSelect={handleSearchSelect}
                  statesList={statesLookup}
                  citiesList={citiesList.map(c => ({ name: c.areaname, st: c.st }))}
                />
              </div>
            )}

            {activeTab === 'states' && (
              <StateAnalytics
                states={statesList}
                cities={citiesList}
                onZoomToState={handleZoomToState}
                selectedStateAbbr={focusedStateAbbr}
                onSelectState={(abbr) => setFocusedStateAbbr(abbr)}
              />
            )}

            {activeTab === 'cities' && (
              <CitiesExplorer
                cities={citiesList}
                onFlyToCity={handleFlyToCity}
                statesList={statesLookup}
              />
            )}

            {activeTab === 'highways' && (
              <HighwaysExplorer
                highways={highwaysList}
                onSelectHighway={(h) => {
                  setSelectedFeature({
                    type: 'highway',
                    properties: h,
                  });
                  setActiveTab('map');
                }}
              />
            )}

            {activeTab === 'counties' && (
              <CountiesExplorer
                initialCountiesSummary={countiesSummary}
                statesList={statesLookup}
                onSelectStateOnMap={handleZoomToState}
              />
            )}

            {activeTab === 'api' && (
              <RestApiInspector />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 px-4 lg:px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-400">ESRI Sample Server 6</span>
          <span>•</span>
          <span>USA MapServer</span>
          <span>•</span>
          <span>Census 2000 Demographics</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <a
            href="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-300 flex items-center gap-1 transition"
          >
            <span>Service REST Endpoint</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>

    </div>
  );
}
