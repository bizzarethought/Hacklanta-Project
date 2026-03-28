import ScoreCard from './ScoreCard';

export default function PropertyPanel({ data, year }: { data: any, year: number }) {
  const currentRisk = data.composite_score + ((year - 2024) * 0.5);

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
           <div className="flex gap-2 items-center text-gray-400 mb-1 text-sm">
             <span>🏠</span> Residential Property
           </div>
           <h2 className="text-xl font-bold text-white leading-tight">{data.address.split(',')[0]}</h2>
           <p className="text-sm text-gray-400">{data.address.split(',')[1]?.trim()}</p>
        </div>
        {data.fair_plan_stress && (
           <div className="glass-pill px-3 py-1 flex items-center gap-1 text-climate-hazard-high text-xs mt-1 border border-red-500/30">
           <span>🚫</span> FAIR Plan
         </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Insured Value</p>
          <p className="text-lg font-light text-white">${(data.insured_value).toLocaleString()}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Current Premium</p>
          <p className="text-lg font-light text-white">${(data.annual_premium_estimate).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-climate-border">
         <ScoreCard score={Math.min(currentRisk, 100)} hazards={data.hazards} />
      </div>
    </div>
  );
}
