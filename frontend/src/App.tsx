import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MapView from './components/Map';
import PropertyPanel from './components/PropertyPanel';
import ActionableImprovements from './components/ActionableImprovements';
import PremiumTrajectory from './components/PremiumTrajectory';
import InsuranceList from './components/InsuranceList';

function ShieldAlertIcon(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <path d="M12 2L3 5v6c0 5.25 3.75 9.74 9 11 5.25-1.26 9-5.75 9-11V5l-9-3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 16h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DEMO_PROPERTIES = [
  { label: '125 Ocean Drive',     sublabel: 'Miami Beach, FL',   address: '125 Ocean Drive, Miami FL 33139' },
  { label: '1000 Brickell Ave',   sublabel: 'Miami, FL',         address: '1000 Brickell Ave, Miami FL 33131' },
  { label: '8800 SW 232nd St',    sublabel: 'South Miami, FL',   address: '8800 SW 232nd St, Miami FL 33190' },
  { label: '16001 Collins Ave',   sublabel: 'Sunny Isles, FL',   address: '16001 Collins Ave, Sunny Isles FL 33160' },
  { label: '3 Island Ave',        sublabel: 'Miami Beach, FL',   address: '3 Island Ave, Miami Beach FL 33139' },
];

function App() {
  const [inputValue, setInputValue] = useState('');
  const [activeAddress, setActiveAddress] = useState('');
  const [riskData, setRiskData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [trajectoryData, setTrajectoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(2024);
  const [overrides, setOverrides] = useState<Record<string, any>>({});

  const buildQueryParams = useCallback((address: string, extraOverrides?: Record<string, any>) => {
    const params: Record<string, string> = { address };
    const merged = { ...overrides, ...extraOverrides };
    if (merged.insured_value) params.insured_value = String(merged.insured_value);
    if (merged.user_premium) params.user_premium = String(merged.user_premium);
    if (merged.building_type) params.building_type = merged.building_type;
    return new URLSearchParams(params).toString();
  }, [overrides]);

  useEffect(() => {
    if (!activeAddress) return;
    async function fetchData() {
      setLoading(true);
      setRiskData(null);
      setRecommendations(null);
      setTrajectoryData(null);
      try {
        const qs = buildQueryParams(activeAddress);
        const [riskRes, recRes, trajRes] = await Promise.all([
          axios.get(`http://localhost:8000/risk?${qs}`),
          axios.get(`http://localhost:8000/recommendations?${qs}`),
          axios.get(`http://localhost:8000/trajectory?${qs}`)
        ]);
        setRiskData(riskRes.data);
        setRecommendations(recRes.data);
        setTrajectoryData(trajRes.data);
      } catch (e) {
        console.error('Failed to fetch API data', e);
      }
      setLoading(false);
    }
    fetchData();
  }, [activeAddress, buildQueryParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputValue.trim()) {
      setOverrides({});
      setActiveAddress(inputValue.trim());
    }
  }

  function selectDemo(address: string) {
    setInputValue(address);
    setOverrides({});
    setActiveAddress(address);
  }

  function handleOverride(field: string, value: any) {
    const newOverrides = { ...overrides, [field]: value };
    setOverrides(newOverrides);
    // Re-fetch with the override
    if (activeAddress) {
      const qs = buildQueryParams(activeAddress, newOverrides);
      setLoading(true);
      Promise.all([
        axios.get(`http://localhost:8000/risk?${qs}`),
        axios.get(`http://localhost:8000/recommendations?${qs}`),
        axios.get(`http://localhost:8000/trajectory?${qs}`)
      ]).then(([riskRes, recRes, trajRes]) => {
        setRiskData(riskRes.data);
        setRecommendations(recRes.data);
        setTrajectoryData(trajRes.data);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }

  return (
    <div className="w-full h-screen relative bg-climate-bg overflow-hidden flex">
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <MapView riskData={riskData} year={year} />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 pointer-events-none flex justify-between items-start gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 glass-panel px-5 py-3 pointer-events-auto shrink-0">
          <ShieldAlertIcon className="text-climate-cyan drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
          <h1 className="text-xl font-bold tracking-wider text-white">CLIMATE<span className="text-climate-cyan font-light">GUARD</span></h1>
        </div>

        {/* Address Search */}
        <form
          onSubmit={handleSubmit}
          className="glass-panel px-4 py-3 pointer-events-auto flex items-center gap-3 flex-1 max-w-[480px]"
        >
          <span className="text-gray-400 text-base">📍</span>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Enter a US property address..."
            className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500"
          />
          <button
            type="submit"
            className="text-climate-cyan font-bold text-sm hover:text-white transition px-2"
          >
            Analyze →
          </button>
        </form>

        {/* Time Slider — only shown when data is loaded */}
        {riskData && (
          <div className="glass-panel px-6 py-3 pointer-events-auto w-[360px] flex flex-col gap-2 shrink-0">
            <div className="flex justify-between text-xs text-climate-cyan font-semibold uppercase tracking-widest">
              <span>Current Risk</span>
              <span>Projected ({year})</span>
            </div>
            <input
              type="range"
              min="2024" max="2044"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-climate-cyan"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>2024</span>
              <span>2034</span>
              <span>2044</span>
            </div>
          </div>
        )}
      </div>

      {/* Sidebars */}
      <div className="relative z-10 w-full h-full p-6 pt-24 pb-6 flex justify-between pointer-events-none gap-6">

        {/* Left: Property Profile */}
        <div className="w-[400px] h-full flex flex-col gap-4 pointer-events-auto overflow-y-auto pr-2 pb-10">
          {!activeAddress ? (
            <div className="glass-panel p-5 flex flex-col gap-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Demo Properties — Miami-Dade</p>
              {DEMO_PROPERTIES.map(p => (
                <button
                  key={p.address}
                  onClick={() => selectDemo(p.address)}
                  className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-climate-cyan/40 rounded-lg px-4 py-3 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-climate-cyan transition-colors">{p.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.sublabel}</p>
                    </div>
                    <span className="text-climate-cyan opacity-0 group-hover:opacity-100 transition-opacity text-sm">→</span>
                  </div>
                </button>
              ))}
              <p className="text-[10px] text-gray-600 text-center pt-1">or type any US address above</p>
            </div>
          ) : loading ? (
            <div className="glass-panel w-full h-64 flex items-center justify-center animate-pulse">
              <span className="text-climate-cyan">Loading risk profile...</span>
            </div>
          ) : riskData && trajectoryData ? (
            <>
              <PropertyPanel data={riskData} year={year} onOverride={handleOverride} />
              <PremiumTrajectory data={trajectoryData} currentYear={year} />
            </>
          ) : null}
        </div>

        {/* Right: Interventions */}
        <div className="w-[480px] h-full flex flex-col gap-4 pointer-events-auto overflow-y-auto pr-2 pb-10">
          {!activeAddress ? (
            <div className="glass-panel p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[220px]">
              <span className="text-4xl">🛠️</span>
              <p className="text-sm text-gray-400 leading-relaxed">AI-powered mitigation recommendations<br/>and insurer matching will appear here</p>
            </div>
          ) : loading ? (
            <div className="glass-panel w-full h-64 flex items-center justify-center animate-pulse">
              <span className="text-climate-cyan">Synthesizing recommendations...</span>
            </div>
          ) : recommendations ? (
            <>
              <ActionableImprovements
                summary={recommendations.summary}
                improvements={recommendations.improvements}
              />
              <InsuranceList insurers={recommendations.insurers} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
