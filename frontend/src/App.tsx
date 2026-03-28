import { useState, useEffect } from 'react';
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

function App() {
  const [activeAddress, setActiveAddress] = useState("125 Ocean Drive, Miami FL 33139");
  const [riskData, setRiskData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [trajectoryData, setTrajectoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Time slider state 2024 to 2044
  const [year, setYear] = useState(2024);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [riskRes, recRes, trajRes] = await Promise.all([
          axios.get(`http://localhost:8000/risk?address=${encodeURIComponent(activeAddress)}`),
          axios.get(`http://localhost:8000/risk/recommendations?address=${encodeURIComponent(activeAddress)}`),
          axios.get(`http://localhost:8000/trajectory?address=${encodeURIComponent(activeAddress)}`)
        ]);
        setRiskData(riskRes.data);
        setRecommendations(recRes.data);
        setTrajectoryData(trajRes.data);
      } catch (e) {
        console.error("Failed to fetch API data", e);
      }
      setLoading(false);
    }
    fetchData();
  }, [activeAddress]);

  return (
    <div className="w-full h-screen relative bg-climate-bg overflow-hidden flex">
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
         <MapView riskData={riskData} year={year} />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 pointer-events-none flex justify-between items-start">
        <div className="flex items-center gap-3 glass-panel px-5 py-3 pointer-events-auto">
          <ShieldAlert className="text-climate-cyan drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
          <h1 className="text-xl font-bold tracking-wider text-white">CLIMATE<span className="text-climate-cyan font-light">GUARD</span></h1>
        </div>

        {/* Time Travel Slider positioned Top Center */}
        <div className="glass-panel px-6 py-3 pointer-events-auto w-[400px] flex flex-col gap-2">
            <div className="flex justify-between text-xs text-climate-cyan font-semibold uppercase tracking-widest">
                <span>Current Risk</span>
                <span>Projected ({year})</span>
            </div>
            <input 
              type="range" 
              min="2024" max="2044" 
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-climate-cyan"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
                <span>2024</span>
                <span>2034</span>
                <span>2044</span>
            </div>
        </div>
        
        <div className="w-[150px]"></div> {/* Spacer */}
      </div>

      {/* Layout Content */}
      <div className="relative z-10 w-full h-full p-6 pt-24 pb-6 flex justify-between pointer-events-none gap-6">
        
        {/* Left Sidebar: Property Profile */}
        <div className="w-[400px] h-full flex flex-col gap-4 pointer-events-auto overflow-y-auto pr-2 pb-10">
          {!loading && riskData && trajectoryData ? (
            <>
              <PropertyPanel data={riskData} year={year} />
              <PremiumTrajectory data={trajectoryData} currentYear={year} />
            </>
          ) : (
             <div className="glass-panel w-full h-64 flex items-center justify-center animate-pulse">
                <span className="text-climate-cyan">Loading risk profile...</span>
             </div>
          )}
        </div>

        {/* Right Sidebar: Interventions */}
        <div className="w-[480px] h-full flex flex-col gap-4 pointer-events-auto overflow-y-auto pr-2 pb-10">
          {!loading && recommendations ? (
            <>
              <ActionableImprovements 
                summary={recommendations.summary} 
                improvements={recommendations.improvements} 
              />
              <InsuranceList insurers={recommendations.insurers} />
            </>
          ) : (
             <div className="glass-panel w-full h-64 flex items-center justify-center animate-pulse">
                <span className="text-climate-cyan">Synthesizing recommendations...</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
