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
      <div className="flex justify-between items-end mb-4">
         <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-widest">Composite Score</h3>
            <p className="text-[10px] text-gray-500 mt-1">1-100 Risk Index</p>
         </div>
         <div className="flex items-baseline gap-1" style={{ color }}>
            <span className="text-5xl font-black drop-shadow-md">{currentScoreStr}</span>
            <span className="text-sm font-bold opacity-50">/ 100</span>
         </div>
      </div>
      
      <div className="flex flex-col gap-2 relative z-10">
        {Object.entries(hazards).map(([key, data]: [string, any]) => (
            <div key={key} className="flex justify-between items-center text-xs">
               <span className="capitalize w-20 text-gray-300 font-medium">{key}</span>
               <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden mx-3 shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                        width: `${data.score * 10}%`,
                        backgroundColor: getColor(data.score * 10),
                        boxShadow: `0 0 8px ${getColor(data.score * 10)}80`
                    }}
                   />
               </div>
               <span className="w-8 text-right font-mono text-gray-400">{data.score}/10</span>
            </div>
        ))}
      </div>
    </div>
  );
}
