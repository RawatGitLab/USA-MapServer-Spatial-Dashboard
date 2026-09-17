import React, { useState, useMemo } from 'react';
import { 
  Route, 
  Search, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Compass, 
  Filter 
} from 'lucide-react';
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
import { HighwayFeatureProperties } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatNumber, getHighwayColor } from '../utils/geoUtils';

interface HighwaysExplorerProps {
  highways: HighwayFeatureProperties[];
  onSelectHighway?: (h: HighwayFeatureProperties) => void;
}

const HIGHWAY_TYPE_COLORS: Record<string, string> = {
  'Interstate': '#38bdf8',
  'US Highway': '#fbbf24',
  'State Highway': '#34d399',
  'Other': '#94a3b8'
};

export const HighwaysExplorer: React.FC<HighwaysExplorerProps> = ({
  highways,
  onSelectHighway,
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tollFilter, setTollFilter] = useState('all');
  const [sortField, setSortField] = useState<'length' | 'route' | 'type'>('length');
  const [sortAsc, setSortAsc] = useState(false);

  // Total mileage
  const totalMileage = useMemo(() => {
    return highways.reduce((sum, h) => sum + (h.length || 0), 0);
  }, [highways]);

  // Classification Aggregation
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    highways.forEach(h => {
      let t = 'Other';
      const raw = (h.type || '').toLowerCase();
      if (raw.includes('interstate')) t = 'Interstate';
      else if (raw.includes('us')) t = 'US Highway';
      else if (raw.includes('state')) t = 'State Highway';
      counts[t] = (counts[t] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: count,
      percentage: ((count / highways.length) * 100).toFixed(1)
    }));
  }, [highways]);

  // Toll Breakdown
  const tollCount = useMemo(() => {
    return highways.filter(h => h.toll_rd === 'Y').length;
  }, [highways]);

  // Top 15 Longest Segments
  const longestHighways = useMemo(() => {
    return [...highways]
      .filter(h => h.length && h.length > 0)
      .sort((a, b) => b.length - a.length)
      .slice(0, 12)
      .map(h => ({
        name: h.route ? `Route ${h.route}` : `#${h.rte_num1 || h.objectid}`,
        type: h.type || 'Interstate',
        length: Math.round(h.length),
      }));
  }, [highways]);

  // Filtered Highways
  const filteredHighways = useMemo(() => {
    return highways
      .filter(h => {
        const matchesSearch = (h.route || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (h.rte_num1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (h.type || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesType = true;
        if (typeFilter !== 'all') {
          const raw = (h.type || '').toLowerCase();
          if (typeFilter === 'interstate') matchesType = raw.includes('interstate');
          else if (typeFilter === 'us') matchesType = raw.includes('us');
          else if (typeFilter === 'state') matchesType = raw.includes('state');
        }

        let matchesToll = true;
        if (tollFilter === 'toll') matchesToll = h.toll_rd === 'Y';
        if (tollFilter === 'free') matchesToll = h.toll_rd !== 'Y';

        return matchesSearch && matchesType && matchesToll;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [highways, searchTerm, typeFilter, tollFilter, sortField, sortAsc]);

  const handleSort = (field: 'length' | 'route' | 'type') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Section: Overview & Longest Highways Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Summary cards */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <Route className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">Highways Network (Layer 1)</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Federal Interstate highway network, US transcontinental routes, and major turnpike systems with line geometry and administrative class metadata.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Mileage</span>
              <p className="text-lg font-bold text-white font-mono mt-0.5">
                {formatNumber(Math.round(totalMileage))} mi
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Toll Corridors</span>
              <p className="text-lg font-bold text-rose-400 font-mono mt-0.5">
                {tollCount} segments
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Class Breakdown</span>
            {typeDistribution.map((td, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: HIGHWAY_TYPE_COLORS[td.name] || '#94a3b8' }}
                  ></span>
                  <span className="text-slate-300">{td.name}</span>
                </div>
                <span className="font-mono text-slate-400">{td.value} ({td.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Longest Segments Chart */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                Longest Highway Segments (Miles)
              </h3>
              <p className="text-[11px] text-slate-400">Layer 1 Polyline Length</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={longestHighways} margin={{ top: 10, right: 10, left: 10, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDark ? "#94a3b8" : "#64748b"} 
                  fontSize={10} 
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis 
                  stroke={isDark ? "#94a3b8" : "#64748b"} 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(v) => `${v}m`}
                />
                <Tooltip
                  cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                        <p className="font-bold text-white">{d.name}</p>
                        <p className="text-slate-400 text-[11px]">{d.type}</p>
                        <p className="text-sky-400 font-mono mt-1">Length: {formatNumber(d.length)} miles</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="length" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Section: Filterable Highways Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        
        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search route (e.g. I- 80, US 101)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Highway Types</option>
              <option value="interstate">Interstates Only</option>
              <option value="us">US Routes Only</option>
              <option value="state">State Routes Only</option>
            </select>

            {/* Toll filter */}
            <select
              value={tollFilter}
              onChange={(e) => setTollFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Toll Statuses</option>
              <option value="toll">Toll Roads Only</option>
              <option value="free">Non-Toll (Freeways)</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {filteredHighways.length} of {highways.length} segments
          </div>

        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th 
                  onClick={() => handleSort('route')}
                  className="px-4 py-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Route Designation</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('type')}
                  className="px-4 py-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Highway Type</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3">Admin Class</th>
                <th className="px-4 py-3">Toll Status</th>
                <th 
                  onClick={() => handleSort('length')}
                  className="px-4 py-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Segment Length (Miles)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredHighways.map((h, idx) => {
                const isToll = h.toll_rd === 'Y';

                return (
                  <tr 
                    key={h.objectid || idx}
                    onClick={() => onSelectHighway?.(h)}
                    className="hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-sans font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2.5 h-1 rounded bg-sky-400"></span>
                      <span>{h.route ? `Route ${h.route}` : `Hwy #${h.rte_num1 || h.objectid}`}</span>
                    </td>
                    <td className="px-4 py-2.5 font-sans text-slate-300">
                      {h.type}
                    </td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">
                      {h.admn_class || 'Standard'}
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      {isToll ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[10px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                          Toll Road
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[10px]">Freeway</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-100">
                      {h.length ? `${h.length.toFixed(1)} mi` : 'N/A'}
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
