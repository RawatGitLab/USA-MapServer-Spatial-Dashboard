import React, { useState } from 'react';
import { 
  MapPin, 
  BarChart3, 
  Building2, 
  Route, 
  Layers, 
  Terminal, 
  Info, 
  ExternalLink, 
  CheckCircle2,
  X
} from 'lucide-react';
import { ActiveTab } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onSearchSelect?: (query: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  statesList?: { name: string; abbr: string }[];
  citiesList?: { name: string; st: string }[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <header className="bg-slate-900/95 border-b border-black dark:border-slate-800 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Brand & Service Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none">
                  USA Map-Server Spatial Dashboard
                </h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live REST
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>WKID 4326</span>
                <span>•</span>
                <span>4 Spatial Layers</span>
                <span>•</span>
                <span className="text-slate-500">sampleserver6.arcgisonline.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition"
              title="Dataset Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Tabs Navigation */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-black dark:border-slate-800/80 overflow-x-auto max-w-full">
          <button
            onClick={() => onTabChange('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>

          <button
            onClick={() => onTabChange('states')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'states'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>States Analytics</span>
          </button>

          <button
            onClick={() => onTabChange('cities')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'cities'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cities (3.5k)</span>
          </button>

          <button
            onClick={() => onTabChange('highways')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'highways'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Highways (679)</span>
          </button>

          <button
            onClick={() => onTabChange('counties')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'counties'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Counties (3.1k)</span>
          </button>

          <button
            onClick={() => onTabChange('api')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>REST API</span>
          </button>
        </nav>

        {/* Right: Theme Toggle & Info Modal */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            onClick={() => setShowInfoModal(true)}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/80 border border-black dark:border-slate-800 transition"
            title="Dataset Information"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dataset Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ArcGIS USA MapServer Metadata</h3>
                <p className="text-xs text-slate-400">Sample Server 6 REST Specification</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                This visualizer connects directly to the official ESRI sample MapServer providing authoritative cartographic and census GIS layers for the United States.
              </p>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service URL:</span>
                  <span className="text-blue-400 truncate max-w-[260px]">USA/MapServer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Spatial Reference:</span>
                  <span className="text-slate-300">WGS84 (WKID 4326)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supported Formats:</span>
                  <span className="text-slate-300">JSON, GeoJSON, PNG32</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Capabilities:</span>
                  <span className="text-emerald-400">Map, Query, Data, WMS</span>
                </div>
              </div>

              <h4 className="font-semibold text-slate-200 pt-1">Included Layers:</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <strong className="text-slate-200">Layer 0 (Cities):</strong> 3,557 incorporated cities, towns, and places with Census 2000 population and state capital indicators.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <strong className="text-slate-200">Layer 1 (Highways):</strong> 679 major Interstate highways, US routes, and state arterials with length & toll metadata.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  <strong className="text-slate-200">Layer 2 (States):</strong> 51 US states + DC with sub-regions, population, density, and spatial boundaries.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <strong className="text-slate-200">Layer 3 (Counties):</strong> 3,141 US counties with population density and land area.
                </li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
              <a
                href="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
              >
                <span>Open REST Endpoint</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
