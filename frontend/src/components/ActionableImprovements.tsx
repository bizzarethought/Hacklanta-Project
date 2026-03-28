export default function ActionableImprovements({ summary, improvements }: { summary: string, improvements: any[] }) {
  const totalSavings = improvements.reduce((acc, curr) => acc + curr.annual_saving_usd, 0);
  const totalCost = improvements.reduce((acc, curr) => acc + curr.cost_usd, 0);

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
       <div className="flex items-center gap-2 text-climate-cyan mb-2 border-b border-climate-border pb-3">
          <span className="text-xl">🛠️</span>
          <h2 className="text-lg font-bold">Actionable ROI Interventions</h2>
       </div>
       
       <p className="text-[13px] leading-relaxed text-gray-300 italic mb-2 border-l-2 border-climate-cyan pl-3">
          "{summary}"
       </p>

       <div className="flex flex-col gap-3">
         {improvements.map((imp: any, idx: number) => (
           <div key={idx} className="bg-black/40 rounded-lg p-3 hover:bg-white/5 transition border border-white/5 group">
              <div className="flex justify-between items-center mb-2">
                 <h4 className="font-semibold text-sm group-hover:text-climate-cyan transition-colors">{imp.action}</h4>
                 <span className="text-climate-cyan font-mono font-bold text-xs bg-climate-cyan/10 px-2 py-0.5 rounded-sm">{imp.roi_pct}% ROI</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                 <div className="flex items-center gap-1">
                    <span className="text-gray-400">💲</span>
                    <span>Cost: ${(imp.cost_usd).toLocaleString()}</span>
                 </div>
                 <div className="flex items-center gap-1 text-green-400">
                    <span>-${(imp.annual_saving_usd).toLocaleString()}/yr</span>
                 </div>
              </div>
           </div>
         ))}
       </div>

       <div className="mt-3 pt-3 border-t border-climate-border flex justify-between items-center text-sm">
          <span className="text-gray-400 uppercase tracking-widest text-[10px]">Total Mitigation Cost</span>
          <span className="font-mono text-gray-300">${totalCost.toLocaleString()}</span>
       </div>
       <div className="flex justify-between items-center text-sm">
          <span className="text-climate-cyan font-bold uppercase tracking-widest text-[10px]">Max Potential Savings</span>
          <span className="font-mono text-green-400 font-bold">${totalSavings.toLocaleString()}/yr</span>
       </div>
    </div>
  );
}
