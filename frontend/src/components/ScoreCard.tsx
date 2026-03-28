const HAZARD_ICONS: Record<string, { icon: string; label: string }> = {
  flood:   { icon: 'fa-solid fa-water',             label: 'Flood' },
  fire:    { icon: 'fa-solid fa-fire',              label: 'Wildfire' },
  wind:    { icon: 'fa-solid fa-wind',              label: 'Wind' },
  heat:    { icon: 'fa-solid fa-temperature-high',  label: 'Heat' },
  seismic: { icon: 'fa-solid fa-mountain',          label: 'Seismic' },
};

export default function ScoreCard({ score, hazards }: { score: number, hazards: any }) {
  const getColor = (val: number) => {
    if (val < 40) return '#f59e0b'; // amber
    if (val < 70) return '#ea580c'; // orange
    return '#ef4444'; // red
  };

  const currentScoreStr = score.toFixed(0);
  const color = getColor(score);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-end mb-3">
         <div>
            <h3 className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <i className="fa-solid fa-gauge-high text-[8px]" style={{ color }} />
              Composite Score
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">1–100 Risk Index</p>
         </div>
         <div className="flex items-baseline gap-1" style={{ color }}>
            <span className="text-5xl font-black" style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}>{currentScoreStr}</span>
            <span className="text-sm font-bold opacity-40">/ 100</span>
         </div>
      </div>
      
      <div className="flex flex-col gap-2.5 relative z-10">
        {Object.entries(hazards).map(([key, data]: [string, any]) => {
          const info = HAZARD_ICONS[key] || { icon: 'fa-solid fa-circle', label: key };
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
               <i className={`${info.icon} w-4 text-[10px] text-gray-500`} />
               <span className="w-14 text-gray-300 font-medium text-[11px]">{info.label}</span>
               <div className="flex-1 h-[6px] bg-black/40 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                        width: `${data.score * 10}%`,
                        backgroundColor: getColor(data.score * 10),
                        boxShadow: `0 0 6px ${getColor(data.score * 10)}60`
                    }}
                   />
               </div>
               <span className="w-8 text-right font-mono text-gray-400 text-[11px] tabular-nums">{data.score}/10</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
