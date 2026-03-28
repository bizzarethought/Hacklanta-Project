import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MapView from './components/Map';
import PropertyPanel from './components/PropertyPanel';
import ActionableImprovements from './components/ActionableImprovements';
import PremiumTrajectory from './components/PremiumTrajectory';
import InsuranceList from './components/InsuranceList';
import LandingPage from './components/LandingPage';
import LoadingTransition from './components/LoadingTransition';
import DisasterSim from './components/DisasterSim';

type AppPhase = 'landing' | 'loading' | 'app';

const DEMO_PROPERTIES = [
  { label: '125 Ocean Drive',     sublabel: 'Miami Beach, FL',   address: '125 Ocean Drive, Miami FL 33139' },
  { label: '1000 Brickell Ave',   sublabel: 'Miami, FL',         address: '1000 Brickell Ave, Miami FL 33131' },
  { label: '8800 SW 232nd St',    sublabel: 'South Miami, FL',   address: '8800 SW 232nd St, Miami FL 33190' },
  { label: '16001 Collins Ave',   sublabel: 'Sunny Isles, FL',   address: '16001 Collins Ave, Sunny Isles FL 33160' },
  { label: '3 Island Ave',        sublabel: 'Miami Beach, FL',   address: '3 Island Ave, Miami Beach FL 33139' },
];

/* Skeleton loader that looks like the real panel */
function SkeletonPanel({ lines = 6 }: { lines?: number }) {
  return (
    <div className="glass-panel p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-5 h-5 rounded bg-white/[0.06] skeleton-shimmer" />
        <div className="h-4 rounded bg-white/[0.06] skeleton-shimmer" style={{ width: '55%' }} />
      </div>
      <div className="h-6 rounded bg-white/[0.04] skeleton-shimmer" style={{ width: '70%' }} />
      <div className="h-3 rounded bg-white/[0.03] skeleton-shimmer" style={{ width: '45%' }} />
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="h-16 rounded-lg bg-white/[0.03] skeleton-shimmer" />
        <div className="h-16 rounded-lg bg-white/[0.03] skeleton-shimmer" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 rounded-full bg-white/[0.04] flex-1 skeleton-shimmer" style={{ animationDelay: `${i * 0.08}s` }} />
          <div className="h-2 w-8 rounded bg-white/[0.03] skeleton-shimmer" style={{ animationDelay: `${i * 0.08 + 0.04}s` }} />
        </div>
      ))}
    </div>
  );
}

function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>('landing');
  const [inputValue, setInputValue] = useState('');
  const [activeAddress, setActiveAddress] = useState('');
  const [riskData, setRiskData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [trajectoryData, setTrajectoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [year, setYear] = useState(2024);
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [simHazard, setSimHazard] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

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
      setError('');
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
      } catch (e: any) {
        const detail = e?.response?.data?.detail;
        setError(detail?.includes('geocod') || detail?.includes('No geocoding')
          ? 'Address not found. Try adding city and state, e.g. "123 Main St, Miami FL".'
          : 'Could not load data for this address. Please try again.');
        setActiveAddress('');
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

  // --- Phase gates ---
  if (appPhase === 'landing') {
    return <LandingPage onEnter={() => setAppPhase('loading')} />;
  }

  if (appPhase === 'loading') {
    return <LoadingTransition onComplete={() => setAppPhase('app')} />;
  }

  // --- Main app (phase === 'app') ---
  return (
    <div className="w-full h-screen relative bg-climate-bg overflow-hidden flex">
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <MapView riskData={riskData} year={year} />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 pointer-events-none flex justify-between items-start gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 glass-panel px-5 py-3 pointer-events-auto shrink-0">
          <i className="fa-solid fa-shield-halved text-climate-cyan text-lg" style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.7))' }} />
          <h1 className="text-xl font-bold tracking-wider text-white">
            CLIMATE<span className="text-climate-cyan font-light">GUARD</span>
          </h1>
        </div>

        {/* Address Search */}
        <form
          onSubmit={handleSubmit}
          className="glass-panel px-4 py-3 pointer-events-auto flex items-center gap-3 flex-1 max-w-[480px]"
        >
          <i className="fa-solid fa-location-dot text-gray-500 text-sm" />
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Enter a US property address..."
            className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="text-climate-cyan font-bold text-sm hover:text-white transition px-2 disabled:opacity-40"
          >
            {loading ? (
              <i className="fa-solid fa-spinner fa-spin" />
            ) : (
              <>Analyze <i className="fa-solid fa-arrow-right text-xs ml-1" /></>
            )}
          </button>
        </form>

        {/* Disaster Sim Button */}
        {riskData && (
          <button
            onClick={() => {
              const top = Object.entries(riskData.hazards)
                .sort((a: any, b: any) => b[1].score - a[1].score)[0][0];
              setSimHazard(top);
            }}
            className="glass-panel px-4 py-3 pointer-events-auto flex items-center gap-2 shrink-0 hover:border-red-500/50 transition-all group"
            title="Simulate the top disaster risk for this property"
          >
            <span className="text-lg">🌪️</span>
            <span className="text-xs font-bold text-red-400 group-hover:text-red-300 tracking-wider uppercase">Disaster Mode</span>
          </button>
        )}

        {/* Time Slider */}
        {riskData && (
          <div className="glass-panel px-6 py-3 pointer-events-auto w-[340px] flex flex-col gap-2 shrink-0">
            <div className="flex justify-between text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
              <span>
                <i className="fa-solid fa-clock text-[8px] mr-1 text-climate-cyan" />
                Projection
              </span>
              <span className="text-climate-cyan font-mono">{year}</span>
            </div>
            <input
              type="range"
              min="2024" max="2044"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-climate-cyan"
            />
            <div className="flex justify-between text-[9px] text-gray-500 font-mono">
              <span>2024</span>
              <span>2034</span>
              <span>2044</span>
            </div>
          </div>
        )}
      </div>

      {/* Main content panels */}
      <div className="relative z-10 w-full h-full p-6 pt-24 pb-6 flex justify-between pointer-events-none gap-2">

        {/* Left column + toggle */}
        <div className="flex items-start gap-1 pointer-events-auto h-full">
          <div
            className="flex flex-col gap-4 pb-10 scrollbar-thin transition-all duration-300"
            style={{
              width: leftOpen ? 400 : 0,
              opacity: leftOpen ? 1 : 0,
              overflowY: leftOpen ? 'auto' : 'hidden',
              overflowX: 'hidden',
              flexShrink: 0,
            }}
          >
            {error && (
              <div className="glass-panel p-4 flex items-center gap-3 border border-red-500/30">
                <i className="fa-solid fa-circle-exclamation text-red-400 text-sm shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
            {!activeAddress ? (
              <div className="glass-panel p-5 flex flex-col gap-3">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <i className="fa-solid fa-map-pin text-climate-cyan text-[8px]" />
                  Demo Properties — Miami-Dade
                </p>
                {DEMO_PROPERTIES.map(p => (
                  <button
                    key={p.address}
                    onClick={() => selectDemo(p.address)}
                    className="w-full text-left bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-climate-cyan/30 rounded-lg px-4 py-3 transition-all group outline-none"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-climate-cyan transition-colors">{p.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.sublabel}</p>
                      </div>
                      <i className="fa-solid fa-chevron-right text-[10px] text-climate-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
                <p className="text-[10px] text-gray-600 text-center pt-1">Or type any US address above</p>
              </div>
            ) : loading ? (
              <>
                <SkeletonPanel lines={5} />
                <SkeletonPanel lines={4} />
              </>
            ) : riskData && trajectoryData ? (
              <>
                <PropertyPanel data={riskData} year={year} onOverride={handleOverride} />
                <PremiumTrajectory data={trajectoryData} currentYear={year} />
              </>
            ) : null}
          </div>
          {/* Left toggle button */}
          <button
            onClick={() => setLeftOpen(o => !o)}
            className="mt-2 glass-panel px-2 py-3 text-gray-400 hover:text-climate-cyan hover:border-climate-cyan/30 transition-all text-xs font-bold shrink-0"
            title={leftOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {leftOpen ? '‹' : '›'}
          </button>
        </div>

        {/* Right column + toggle */}
        <div className="flex items-start gap-1 pointer-events-auto h-full">
          {/* Right toggle button */}
          <button
            onClick={() => setRightOpen(o => !o)}
            className="mt-2 glass-panel px-2 py-3 text-gray-400 hover:text-climate-cyan hover:border-climate-cyan/30 transition-all text-xs font-bold shrink-0"
            title={rightOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {rightOpen ? '›' : '‹'}
          </button>
          <div
            className="flex flex-col gap-4 pb-10 scrollbar-thin transition-all duration-300"
            style={{
              width: rightOpen ? 480 : 0,
              opacity: rightOpen ? 1 : 0,
              overflowY: rightOpen ? 'auto' : 'hidden',
              overflowX: 'hidden',
              flexShrink: 0,
            }}
          >
            {!activeAddress ? (
              <div className="glass-panel p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[200px]">
                <i className="fa-solid fa-wand-magic-sparkles text-3xl text-gray-600" />
                <p className="text-sm text-gray-500 leading-relaxed">
                  AI-powered mitigation recommendations<br/>and insurer matching will appear here
                </p>
              </div>
            ) : loading ? (
              <>
                <SkeletonPanel lines={5} />
                <SkeletonPanel lines={4} />
              </>
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

      {/* Disaster Simulation Overlay */}
      {simHazard && (
        <DisasterSim
          hazard={simHazard as any}
          onDone={() => setSimHazard(null)}
        />
      )}

      {/* Skeleton shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.04; }
          50% { opacity: 0.09; }
          100% { opacity: 0.04; }
        }
        .skeleton-shimmer {
          animation: shimmer 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default App;
