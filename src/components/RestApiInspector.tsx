import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Code, 
  Database, 
  Layers, 
  Clock, 
  Loader2,
  Sparkles 
} from 'lucide-react';
import { queryLayer } from '../services/arcgisApi';

interface LayerMeta {
  id: number;
  name: string;
  type: string;
  geometry: string;
  count: string;
  description: string;
  sampleFields: string[];
  presets: { label: string; where: string }[];
}

const LAYERS_METADATA: LayerMeta[] = [
  {
    id: 0,
    name: 'Cities',
    type: 'Feature Layer',
    geometry: 'esriGeometryPoint',
    count: '3,557 records',
    description: 'Incorporated cities, towns, and census designated places with population and capital status.',
    sampleFields: ['objectid', 'areaname', 'class', 'st', 'capital', 'pop2000'],
    presets: [
      { label: 'Metros > 1 Million', where: 'pop2000 > 1000000' },
      { label: 'State Capitals Only', where: "capital = 'Y'" },
      { label: 'California Major Cities', where: "st = 'CA' AND pop2000 > 200000" },
    ]
  },
  {
    id: 1,
    name: 'Highways',
    type: 'Feature Layer',
    geometry: 'esriGeometryPolyline',
    count: '679 records',
    description: 'Federal Interstate highway network, US transcontinental routes, and major turnpikes.',
    sampleFields: ['objectid', 'route', 'type', 'admn_class', 'toll_rd', 'length'],
    presets: [
      { label: 'Toll Roads', where: "toll_rd = 'Y'" },
      { label: 'Interstate Corridors', where: "type LIKE '%Interstate%'" },
      { label: 'Segments > 150 Miles', where: 'length > 150' },
    ]
  },
  {
    id: 2,
    name: 'States',
    type: 'Feature Layer',
    geometry: 'esriGeometryPolygon',
    count: '51 records',
    description: 'All 50 US States plus the District of Columbia with demographics and sub-regions.',
    sampleFields: ['objectid', 'state_name', 'state_abbr', 'sub_region', 'pop2000', 'pop00_sqmi'],
    presets: [
      { label: 'Pacific Sub-Region', where: "sub_region = 'Pacific'" },
      { label: 'States > 10M Population', where: 'pop2000 > 10000000' },
      { label: 'High Density (> 200/mi²)', where: 'pop00_sqmi > 200' },
    ]
  },
  {
    id: 3,
    name: 'Counties',
    type: 'Feature Layer',
    geometry: 'esriGeometryPolygon',
    count: '3,141 records',
    description: 'County boundaries, parishes, and census borough subdivisions across all states.',
    sampleFields: ['objectid', 'name', 'state_name', 'pop2000', 'pop00_sqmi', 'area'],
    presets: [
      { label: 'Texas Mega-Counties', where: "state_name = 'Texas' AND pop2000 > 300000" },
      { label: 'Counties > 1 Million', where: 'pop2000 > 1000000' },
      { label: 'High Density Counties', where: 'pop00_sqmi > 1000' },
    ]
  }
];

export const RestApiInspector: React.FC = () => {
  const [selectedLayerId, setSelectedLayerId] = useState<number>(0);
  const [whereClause, setWhereClause] = useState<string>('pop2000 > 1000000');
  const [outFields, setOutFields] = useState<string>('*');
  const [format, setFormat] = useState<'json' | 'geojson'>('json');
  const [returnGeometry, setReturnGeometry] = useState<boolean>(false);
  const [resultCount, setResultCount] = useState<number>(5);

  const [loading, setLoading] = useState<boolean>(false);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const activeLayer = LAYERS_METADATA.find(l => l.id === selectedLayerId) || LAYERS_METADATA[0];

  const handleRunQuery = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResponseOutput(null);
    const start = performance.now();

    try {
      const res = await queryLayer(selectedLayerId, {
        where: whereClause,
        outFields,
        format,
        returnGeometry,
        resultRecordCount: resultCount,
      });

      const elapsed = Math.round(performance.now() - start);
      setExecutionTime(elapsed);
      setRecordCount(res.features?.length ?? (res.count ?? 0));
      setResponseOutput(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setErrorMsg(err.message || 'REST Query Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!responseOutput) return;
    navigator.clipboard.writeText(responseOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Terminal className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">Live ArcGIS Server Query Console</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Directly test SQL WHERE clauses, format negotiation (JSON / GeoJSON), and schema queries on{' '}
            <code className="text-blue-400 font-mono">USA/MapServer</code>.
          </p>
        </div>

        <a
          href="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-medium transition w-fit"
        >
          <span>Raw MapServer Docs</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* Layer Catalog Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LAYERS_METADATA.map((layer) => {
          const isSelected = selectedLayerId === layer.id;
          return (
            <div
              key={layer.id}
              onClick={() => {
                setSelectedLayerId(layer.id);
                setWhereClause(layer.presets[0]?.where || '1=1');
              }}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-blue-400">
                    Layer {layer.id}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {layer.geometry.replace('esriGeometry', '')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{layer.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {layer.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                {layer.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Query Builder Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Query Parameters Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              Query Parameters
            </h3>
            <span className="text-xs text-blue-400 font-mono font-semibold">
              Layer {selectedLayerId}: {activeLayer.name}
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
              Quick Filter Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {activeLayer.presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setWhereClause(preset.where)}
                  className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* WHERE clause */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              WHERE Clause (SQL):
            </label>
            <input
              type="text"
              value={whereClause}
              onChange={(e) => setWhereClause(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
              placeholder="1=1"
            />
          </div>

          {/* outFields */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Fields (outFields):
            </label>
            <input
              type="text"
              value={outFields}
              onChange={(e) => setOutFields(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="*"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Available: {activeLayer.sampleFields.join(', ')}
            </p>
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="json">JSON (Esri Format)</option>
                <option value="geojson">GeoJSON</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                Max Records
              </label>
              <select
                value={resultCount}
                onChange={(e) => setResultCount(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value={3}>3 Records</option>
                <option value={5}>5 Records</option>
                <option value={10}>10 Records</option>
                <option value={25}>25 Records</option>
                <option value={50}>50 Records</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="returnGeom"
              checked={returnGeometry}
              onChange={(e) => setReturnGeometry(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <label htmlFor="returnGeom" className="text-xs text-slate-300">
              Include coordinates geometry (returnGeometry)
            </label>
          </div>

          {/* Action button */}
          <button
            onClick={handleRunQuery}
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing on ESRI MapServer...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute REST Query</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Response Output Viewer */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between overflow-hidden">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-200">Server Response</span>
              {executionTime !== null && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  {executionTime} ms
                </span>
              )}
              {recordCount !== null && (
                <span className="text-[11px] text-blue-400 font-mono">
                  {recordCount} features returned
                </span>
              )}
            </div>

            {responseOutput && (
              <button
                onClick={handleCopyResponse}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            )}
          </div>

          {/* Code Body */}
          <div className="flex-1 my-3 bg-slate-900/60 rounded-lg p-3 border border-slate-800/80 font-mono text-[11px] overflow-auto max-h-[420px] text-slate-300">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span>Streaming response from sampleserver6.arcgisonline.com...</span>
              </div>
            ) : errorMsg ? (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded text-rose-300">
                {errorMsg}
              </div>
            ) : responseOutput ? (
              <pre className="whitespace-pre-wrap">{responseOutput}</pre>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-500">
                <Sparkles className="w-6 h-6 text-slate-600" />
                <p>Click "Execute REST Query" to inspect the live response from the MapServer.</p>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>ArcGIS REST API v10.91</span>
            <span>Spatial Reference: WKID 4326</span>
          </div>

        </div>

      </div>

    </div>
  );
};
