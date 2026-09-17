import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { 
  Search, 
  ArrowUpDown, 
  MapPin, 
  Building2, 
  Users, 
  TrendingUp, 
  Sparkles,
  ExternalLink,
  ArrowUpRight 
} from 'lucide-react';
import { StateFeatureProperties, CityFeatureProperties } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatCompactNumber, formatNumber, SUB_REGION_NAMES } from '../utils/geoUtils';

interface StateAnalyticsProps {
  states: StateFeatureProperties[];
  cities: CityFeatureProperties[];
  onZoomToState: (stateAbbr: string) => void;
  selectedStateAbbr?: string | null;
  onSelectState: (stateAbbr: string) => void;
}

const REGION_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'
];

export const StateAnalytics: React.FC<StateAnalyticsProps> = ({
  states,
  cities,
  onZoomToState,
  selectedStateAbbr,
  onSelectState,
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubRegion, setSelectedSubRegion] = useState<string>('all');
  const [sortField, setSortField] = useState<'pop2000' | 'pop00_sqmi' | 'state_name'>('pop2000');
  const [sortAsc, setSortAsc] = useState(false);

  // Total National Pop
  const totalPop = useMemo(() => states.reduce((sum, s) => sum + s.pop2000, 0), [states]);

  // Sub-regions list
  const subRegions = useMemo(() => {
    const set = new Set<string>();
    states.forEach(s => s.sub_region && set.add(s.sub_region));
    return Array.from(set).sort();
  }, [states]);

  // Regional Population Aggregation for Pie Chart
  const regionalData = useMemo(() => {
    const map: Record<string, number> = {};
    states.forEach(s => {
      const region = SUB_REGION_NAMES[s.sub_region] || s.sub_region || 'Other';
      map[region] = (map[region] || 0) + (s.pop2000 || 0);
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      percentage: totalPop > 0 ? ((value / totalPop) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.value - a.value);
  }, [states, totalPop]);

  // Top 15 States by Population for Bar Chart
  const top15PopData = useMemo(() => {
    return [...states]
      .sort((a, b) => b.pop2000 - a.pop2000)
      .slice(0, 15)
      .map(s => ({
        name: s.state_abbr,
        fullName: s.state_name,
        population: s.pop2000,
        formattedPop: formatCompactNumber(s.pop2000)
      }));
  }, [states]);

  // Top 15 States by Density
  const top15DensityData = useMemo(() => {
    return [...states]
      .filter(s => s.state_abbr !== 'DC') // Exclude DC outlier for chart readability
      .sort((a, b) => b.pop00_sqmi - a.pop00_sqmi)
      .slice(0, 15)
      .map(s => ({
        name: s.state_abbr,
        fullName: s.state_name,
        density: s.pop00_sqmi,
      }));
  }, [states]);

  // Filtered and Sorted Table Data
  const filteredStates = useMemo(() => {
    return states
      .filter(s => {
        const matchesSearch = s.state_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s.state_abbr.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = selectedSubRegion === 'all' || s.sub_region === selectedSubRegion;
        return matchesSearch && matchesRegion;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [states, searchTerm, selectedSubRegion, sortField, sortAsc]);

  // Active selected state details
  const activeState = useMemo(() => {
    if (!selectedStateAbbr) return states[0] || null;
    return states.find(s => s.state_abbr === selectedStateAbbr) || states[0] || null;
  }, [states, selectedStateAbbr]);

  // Major cities in active state
  const citiesInActiveState = useMemo(() => {
    if (!activeState) return [];
    return cities
      .filter(c => c.st === activeState.state_abbr)
      .sort((a, b) => (b.pop2000 || 0) - (a.pop2000 || 0));
  }, [cities, activeState]);

  const handleSort = (field: 'pop2000' | 'pop00_sqmi' | 'state_name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Section: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Chart 1: Top 15 States by Population */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Top 15 Most Populous States
              </h3>
              <p className="text-[11px] text-slate-400">Census 2000 Population (Millions)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top15PopData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDark ? "#94a3b8" : "#64748b"} 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke={isDark ? "#94a3b8" : "#64748b"} 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                />
                <Tooltip
                  cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                        <p className="font-bold text-white">{data.fullName} ({data.name})</p>
                        <p className="text-blue-400 mt-1 font-mono">
                          Population: {formatNumber(data.population)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="population" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  onClick={(entry) => onSelectState(entry.name)}
                  className="cursor-pointer hover:opacity-80 transition"
                >
                  {top15PopData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === activeState?.state_abbr ? '#f59e0b' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Regional Population Distribution */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Regional Population Share
            </h3>
            <p className="text-[11px] text-slate-400">9 US Census Sub-regions</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionalData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {regionalData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={REGION_COLORS[index % REGION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg shadow-xl text-xs">
                        <p className="font-bold text-white">{data.name}</p>
                        <p className="text-slate-300 font-mono">{formatNumber(data.value)} ({data.percentage}%)</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Legend tags */}
          <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-slate-400">
            {regionalData.slice(0, 6).map((r, i) => (
              <div key={i} className="flex items-center gap-1 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: REGION_COLORS[i] }}></span>
                <span className="truncate">{r.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Middle Section: Active State Highlight Card & Cities in State */}
      {activeState && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-slate-800/40 text-9xl font-black select-none pointer-events-none">
            {activeState.state_abbr}
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold text-sm">
                  {activeState.state_abbr}
                </span>
                <h2 className="text-xl font-bold text-white">{activeState.state_name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {SUB_REGION_NAMES[activeState.sub_region] || activeState.sub_region}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                US Census 2000 demographic baseline from MapServer Layer 2
              </p>
            </div>

            <button
              onClick={() => onZoomToState(activeState.state_abbr)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Locate on Map</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div>
              <span className="text-[11px] text-slate-400">Total Population:</span>
              <p className="text-base font-bold text-slate-100 font-mono mt-0.5">
                {formatNumber(activeState.pop2000)}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Population Density:</span>
              <p className="text-base font-bold text-slate-100 font-mono mt-0.5">
                {activeState.pop00_sqmi} <span className="text-xs text-slate-400 font-normal">people / mi²</span>
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">National Pop Share:</span>
              <p className="text-base font-bold text-blue-400 font-mono mt-0.5">
                {totalPop > 0 ? ((activeState.pop2000 / totalPop) * 100).toFixed(2) : 0}%
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Major Cities Tracked:</span>
              <p className="text-base font-bold text-amber-400 font-mono mt-0.5">
                {citiesInActiveState.length} cities
              </p>
            </div>
          </div>

          {/* List of major cities in this state */}
          {citiesInActiveState.length > 0 && (
            <div className="relative z-10 mt-4 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Top Urban Centers in {activeState.state_name}:
              </span>
              <div className="flex flex-wrap gap-2">
                {citiesInActiveState.slice(0, 10).map((city, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{city.areaname}</span>
                    {city.capital === 'Y' && <span className="text-amber-400 text-[10px]">⭐ Capital</span>}
                    <span className="text-[10px] text-slate-500 font-mono">({formatCompactNumber(city.pop2000)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Section: Full Filterable States Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <h3 className="text-sm font-bold text-slate-100">All 51 Jurisdictions</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {filteredStates.length} shown
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Sub-region filter */}
            <select
              value={selectedSubRegion}
              onChange={(e) => setSelectedSubRegion(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Sub-Regions</option>
              {subRegions.map((sr) => (
                <option key={sr} value={sr}>
                  {SUB_REGION_NAMES[sr] || sr}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0 backdrop-blur z-10">
              <tr>
                <th 
                  onClick={() => handleSort('state_name')}
                  className="px-4 py-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>State / Entity</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3">Abbr</th>
                <th className="px-4 py-3">Sub-Region</th>
                <th 
                  onClick={() => handleSort('pop2000')}
                  className="px-4 py-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Population (2000)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('pop00_sqmi')}
                  className="px-4 py-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Density (/mi²)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">% US Pop</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredStates.map((s) => {
                const isCurrent = activeState?.state_abbr === s.state_abbr;
                const popShare = totalPop > 0 ? ((s.pop2000 / totalPop) * 100).toFixed(2) : '0';

                return (
                  <tr 
                    key={s.state_abbr} 
                    onClick={() => onSelectState(s.state_abbr)}
                    className={`cursor-pointer transition ${
                      isCurrent 
                        ? 'bg-blue-600/15 text-white' 
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">
                      {s.state_name}
                    </td>
                    <td className="px-4 py-2.5 text-blue-400 font-bold">
                      {s.state_abbr}
                    </td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">
                      {SUB_REGION_NAMES[s.sub_region] || s.sub_region}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-100">
                      {formatNumber(s.pop2000)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-300">
                      {s.pop00_sqmi}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400">
                      {popShare}%
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onZoomToState(s.state_abbr);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition text-[10px]"
                        title="Locate on Map"
                      >
                        Locate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
