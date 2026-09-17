import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  MapPin, 
  Star, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  BarChart2 
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
import { CityFeatureProperties } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatCompactNumber, formatNumber } from '../utils/geoUtils';

interface CitiesExplorerProps {
  cities: CityFeatureProperties[];
  onFlyToCity: (city: CityFeatureProperties) => void;
  statesList: { name: string; abbr: string }[];
}

export const CitiesExplorer: React.FC<CitiesExplorerProps> = ({
  cities,
  onFlyToCity,
  statesList,
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [capitalOnly, setCapitalOnly] = useState<boolean>(false);
  const [minPop, setMinPop] = useState<number>(0);
  const [sortField, setSortField] = useState<'pop2000' | 'areaname' | 'st'>('pop2000');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  // Top 15 Cities for bar chart
  const top15Cities = useMemo(() => {
    return [...cities]
      .sort((a, b) => (b.pop2000 || 0) - (a.pop2000 || 0))
      .slice(0, 15)
      .map(c => ({
        name: `${c.areaname}, ${c.st}`,
        pop: c.pop2000,
        formatted: formatCompactNumber(c.pop2000)
      }));
  }, [cities]);

  // Filtered Cities
  const filteredCities = useMemo(() => {
    return cities
      .filter(c => {
        const matchesName = c.areaname.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesState = selectedState === 'all' || c.st === selectedState;
        const matchesCapital = !capitalOnly || c.capital === 'Y';
        const matchesPop = (c.pop2000 || 0) >= minPop;
        return matchesName && matchesState && matchesCapital && matchesPop;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [cities, searchTerm, selectedState, capitalOnly, minPop, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(filteredCities.length / pageSize) || 1;
  const paginatedCities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCities.slice(start, start + pageSize);
  }, [filteredCities, currentPage]);

  const handleSort = (field: 'pop2000' | 'areaname' | 'st') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Section: Overview & Top Cities Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Metadata & Highlights */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Building2 className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">US Cities & Metros (Layer 0)</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contains incorporated municipal jurisdictions, cities, and towns from Census 2000 with official state capital flags and population metrics.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Filtered</span>
              <p className="text-lg font-bold text-white font-mono mt-0.5">
                {formatNumber(filteredCities.length)}
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">State Capitals</span>
              <p className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                50 + DC
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-blue-950/30 border border-blue-900/40 rounded-lg p-2.5">
            <span className="font-semibold text-blue-300">Quick Tip:</span> Click "Fly to Map" on any city in the directory to center and inspect its spatial point on the map.
          </div>
        </div>

        {/* Right: Top 15 US Cities Bar Chart */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                Top 15 Most Populous US Cities
              </h3>
              <p className="text-[11px] text-slate-400">Census 2000 Population</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top15Cities} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
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
                        <p className="text-blue-400 font-mono mt-1">Population: {formatNumber(d.pop)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="pop" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Section: Filterable Cities Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        
        {/* Table Filter Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search city name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* State selector */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All States</option>
              {statesList.map((s) => (
                <option key={s.abbr} value={s.abbr}>
                  {s.name} ({s.abbr})
                </option>
              ))}
            </select>

            {/* Min Population */}
            <select
              value={minPop}
              onChange={(e) => {
                setMinPop(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value={0}>All Populations</option>
              <option value={50000}>&ge; 50,000</option>
              <option value={100000}>&ge; 100,000</option>
              <option value={250000}>&ge; 250,000</option>
              <option value={500000}>&ge; 500,000</option>
              <option value={1000000}>&ge; 1,000,000</option>
            </select>

            {/* Capital filter toggle */}
            <button
              onClick={() => {
                setCapitalOnly(!capitalOnly);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                capitalOnly
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Capitals Only</span>
            </button>
          </div>

          {/* Records count & pagination info */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredCities.length)} of {filteredCities.length}</span>
            <div className="flex items-center gap-1 ml-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 rounded bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-300"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1 rounded bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-300"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th 
                  onClick={() => handleSort('areaname')}
                  className="px-4 py-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>City Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('st')}
                  className="px-4 py-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>State</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3">Jurisdiction Type</th>
                <th className="px-4 py-3">Capital Status</th>
                <th 
                  onClick={() => handleSort('pop2000')}
                  className="px-4 py-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Population (Census 2000)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center">Map Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {paginatedCities.map((city, idx) => {
                const isCapital = city.capital === 'Y';

                return (
                  <tr key={`${city.objectid || idx}`} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">
                      {city.areaname}
                    </td>
                    <td className="px-4 py-2.5 text-blue-400 font-bold font-mono">
                      {city.st}
                    </td>
                    <td className="px-4 py-2.5 font-sans text-slate-400 capitalize">
                      {city.class || 'City'}
                    </td>
                    <td className="px-4 py-2.5">
                      {isCapital ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans text-[10px] font-semibold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          State Capital
                        </span>
                      ) : (
                        <span className="text-slate-500 font-sans text-[11px]">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-100">
                      {formatNumber(city.pop2000)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => onFlyToCity(city)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition text-[10px] font-sans font-medium"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Fly to Map</span>
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
