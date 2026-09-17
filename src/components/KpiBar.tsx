import React, { useState } from 'react';
import { Users, Building, Route, MapPin, Globe2, ChevronRight, ChevronDown, ChevronUp, BarChart } from 'lucide-react';
import { formatCompactNumber, formatNumber } from '../utils/geoUtils';
import { StateFeatureProperties } from '../types';

interface KpiBarProps {
  states: StateFeatureProperties[];
  totalCitiesCount?: number;
  totalHighwaysCount?: number;
  totalCountiesCount?: number;
  onStateSelect?: (stateAbbr: string) => void;
}

export const KpiBar: React.FC<KpiBarProps> = ({
  states,
  totalCitiesCount = 3557,
  totalHighwaysCount = 679,
  totalCountiesCount = 3141,
  onStateSelect,
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const totalPopulation = states.reduce((sum, s) => sum + (s.pop2000 || 0), 0);
  
  // Sorted states
  const sortedByPop = [...states].sort((a, b) => b.pop2000 - a.pop2000);
  const topPopState = sortedByPop[0];

  return (
    <section className="bg-slate-950/60 border-b border-black dark:border-slate-800/80 px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
      {/* Mobile Toggle Bar */}
      <div className="flex sm:hidden items-center justify-between py-0.5">
        <button
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition py-1"
        >
          <div className="flex items-center gap-2">
            <BarChart className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-300">National Demographic Metrics</span>
            <span className="text-[10px] text-blue-400 font-mono">
              {totalPopulation > 0 ? formatCompactNumber(totalPopulation) : '281.4M'} Pop
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>{isMobileExpanded ? 'Hide' : 'Show 6 KPIs'}</span>
            {isMobileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>
      </div>

      <div className={`max-w-7xl mx-auto grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 mt-1 sm:mt-0 ${
        isMobileExpanded ? 'grid' : 'hidden sm:grid'
      }`}>
        
        {/* KPI 1: Total Population */}
        <div className="bg-slate-900/80 border border-black dark:border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between hover:border-slate-700 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium text-slate-400">Total US Pop</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-1 sm:mt-1.5">
            <div className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              {totalPopulation > 0 ? formatCompactNumber(totalPopulation) : '281.4M'}
            </div>
            <p className="text-[10px] text-slate-400">Census 2000 baseline</p>
          </div>
        </div>

        {/* KPI 2: Jurisdictions */}
        <div className="bg-slate-900/80 border border-black dark:border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between hover:border-slate-700 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium text-slate-400">States & DC</span>
            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-1 sm:mt-1.5">
            <div className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              {states.length || 51}
            </div>
            <p className="text-[10px] text-slate-400">9 Sub-regions</p>
          </div>
        </div>

        {/* KPI 3: Counties */}
        <div className="bg-slate-900/80 border border-black dark:border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between hover:border-slate-700 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium text-slate-400">Counties</span>
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-1 sm:mt-1.5">
            <div className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              {formatNumber(totalCountiesCount)}
            </div>
            <p className="text-[10px] text-slate-400">Layer 3 Polygons</p>
          </div>
        </div>

        {/* KPI 4: Cities / Urban Places */}
        <div className="bg-slate-900/80 border border-black dark:border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between hover:border-slate-700 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium text-slate-400">Cities</span>
            <Building className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 sm:mt-1.5">
            <div className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              {formatNumber(totalCitiesCount)}
            </div>
            <p className="text-[10px] text-slate-400">50 State Capitals</p>
          </div>
        </div>

        {/* KPI 5: Highways */}
        <div className="bg-slate-900/80 border border-black dark:border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between hover:border-slate-700 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium text-slate-400">Major Highways</span>
            <Route className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 sm:mt-1.5">
            <div className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              {formatNumber(totalHighwaysCount)}
            </div>
            <p className="text-[10px] text-slate-400">Interstates & Routes</p>
          </div>
        </div>

        {/* KPI 6: Top State Highlight */}
        <div 
          onClick={() => topPopState && onStateSelect?.(topPopState.state_abbr)}
          className="bg-slate-900/80 border border-black dark:border-slate-800 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between hover:border-blue-500/50 cursor-pointer group transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium text-slate-400">Largest State</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="mt-1 sm:mt-1.5">
            <div className="text-base sm:text-lg font-bold text-slate-100 truncate">
              {topPopState?.state_name || 'California'}
            </div>
            <p className="text-[10px] text-blue-400 font-medium truncate">
              {topPopState ? formatCompactNumber(topPopState.pop2000) : '33.9M'} residents
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
