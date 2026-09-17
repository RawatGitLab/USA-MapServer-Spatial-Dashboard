import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  MapPin, 
  Users, 
  Loader2, 
  ArrowUpDown, 
  Building, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { CountyFeatureProperties } from '../types';
import { useTheme } from '../context/ThemeContext';
import { fetchCountiesByState } from '../services/arcgisApi';
import { formatCompactNumber, formatNumber } from '../utils/geoUtils';

interface CountiesExplorerProps {
  initialCountiesSummary: CountyFeatureProperties[];
  statesList: { name: string; abbr: string }[];
  onSelectStateOnMap?: (stateAbbr: string) => void;
}

export const CountiesExplorer: React.FC<CountiesExplorerProps> = ({
  initialCountiesSummary,
  statesList,
  onSelectStateOnMap,
}) => {
  const { isDark } = useTheme();
  const [selectedStateName, setSelectedStateName] = useState<string>('California');
  const [stateCounties, setStateCounties] = useState<CountyFeatureProperties[]>([]);
  const [loadingStateCounties, setLoadingStateCounties] = useState<boolean>(false);
  const [stateFetchError, setStateFetchError] = useState<string | null>(null);
  
  const [nationalSearchTerm, setNationalSearchTerm] = useState('');
  const [stateCountySearchTerm, setStateCountySearchTerm] = useState('');

  // Top 15 Most Populous US Counties
  const top15NationalCounties = useMemo(() => {
    return [...initialCountiesSummary]
      .sort((a, b) => b.pop2000 - a.pop2000)
      .slice(0, 15)
      .map(c => ({
        name: `${c.name}, ${c.state_name}`,
        pop: c.pop2000,
        density: c.pop00_sqmi,
      }));
  }, [initialCountiesSummary]);

  // Top 10 Highest Density Counties
  const top10DensityCounties = useMemo(() => {
    return [...initialCountiesSummary]
      .sort((a, b) => b.pop00_sqmi - a.pop00_sqmi)
      .slice(0, 10)
      .map(c => ({
        name: `${c.name}, ${c.state_name}`,
        density: c.pop00_sqmi,
        pop: c.pop2000,
      }));
  }, [initialCountiesSummary]);

  // Fetch counties for selected state from ArcGIS REST endpoint
  useEffect(() => {
    let isMounted = true;
    async function loadCounties() {
      setLoadingStateCounties(true);
      setStateFetchError(null);
      try {
        const res = await fetchCountiesByState(selectedStateName);
        if (isMounted) {
          const features = res.features || [];
          const list: CountyFeatureProperties[] = features.map((f: any) => ({
            objectid: f.attributes.objectid,
            name: f.attributes.name,
            state_name: f.attributes.state_name,
            pop2000: f.attributes.pop2000 || 0,
            pop00_sqmi: f.attributes.pop00_sqmi || 0,
            area: f.attributes.area || 0,
          }));
          setStateCounties(list);
        }
      } catch (err: any) {
        if (isMounted) {
          setStateFetchError(err.message || 'Failed to query counties from ArcGIS MapServer');
        }
      } finally {
        if (isMounted) {
          setLoadingStateCounties(false);
        }
      }
    }

    loadCounties();
    return () => {
      isMounted = false;
    };
  }, [selectedStateName]);

  // Filtered state counties
  const filteredStateCounties = useMemo(() => {
    return stateCounties.filter(c => 
      c.name.toLowerCase().includes(stateCountySearchTerm.toLowerCase())
    );
  }, [stateCounties, stateCountySearchTerm]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Section: National Top Counties & Density Champions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Chart 1: Largest Counties */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Largest US Counties by Population
            </h3>
            <p className="text-[11px] text-slate-400">MapServer Layer 3 (Census 2000)</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top15NationalCounties} margin={{ top: 10, right: 10, left: 10, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDark ? "#94a3b8" : "#64748b"} 
                  fontSize={10} 
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis 
                  stroke={isDark ? "#94a3b8" : "#64748b"} 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                />
                <Tooltip
                  cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                        <p className="font-bold text-white">{d.name}</p>
                        <p className="text-purple-400 font-mono mt-1">Population: {formatNumber(d.pop)}</p>
                        <p className="text-slate-400 text-[11px]">Density: {d.density} / mi²</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="pop" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Density Ranking List */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Highest Density Counties (mi²)
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">Urban density benchmarks</p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {top10DensityCounties.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-slate-200 font-medium">{c.name}</p>
                      <p className="text-[10px] text-slate-500">Pop: {formatCompactNumber(c.pop)}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-purple-400 text-xs">
                    {formatNumber(c.density)} / mi²
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            3,141 total county polygons available in ArcGIS MapServer Layer 3.
          </div>
        </div>

      </div>

      {/* Bottom Section: Interactive Live State Drill-down */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        
        {/* Controls Header */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live State County Drill-down</h3>
              <p className="text-xs text-slate-400">Queries ArcGIS Server Layer 3 live in real-time</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* State selector */}
            <select
              value={selectedStateName}
              onChange={(e) => setSelectedStateName(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500 font-medium"
            >
              {statesList.map((s) => (
                <option key={s.abbr} value={s.name}>
                  {s.name} ({s.abbr})
                </option>
              ))}
            </select>

            {/* Search inside state counties */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter counties..."
                value={stateCountySearchTerm}
                onChange={(e) => setStateCountySearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4">
          {loadingStateCounties ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <span>Querying Layer 3 for {selectedStateName} counties...</span>
            </div>
          ) : stateFetchError ? (
            <div className="p-4 bg-rose-950/30 border border-rose-800 rounded-lg text-rose-300 text-xs">
              {stateFetchError}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Found <strong className="text-white">{stateCounties.length}</strong> counties in {selectedStateName}
                </span>
                <span className="font-mono text-[11px]">
                  Total State Pop: {formatCompactNumber(stateCounties.reduce((s, c) => s + c.pop2000, 0))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
                {filteredStateCounties.map((c) => (
                  <div 
                    key={c.objectid || c.name}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg hover:border-purple-500/50 transition flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {c.state_name}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-purple-400 font-semibold">{formatNumber(c.pop2000)}</span>
                      <span className="text-slate-500 text-[10px]">{c.pop00_sqmi} / mi²</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
