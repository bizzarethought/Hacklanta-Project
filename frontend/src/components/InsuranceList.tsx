export default function InsuranceList({ insurers }: { insurers: any[] }) {
  return (
    <div className="glass-panel p-5 flex flex-col gap-4 mb-20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
     <div className="flex items-center gap-2 text-climate-cyan mb-2 border-b border-climate-border pb-3">
       <span className="text-xl">🛡️</span>
       <h2 className="text-lg font-bold">Recommended Insurers</h2>
     </div>

       <div className="flex flex-col gap-3">
         {insurers.map((carrier: any, idx: number) => (
           <div key={idx} className="bg-black/30 rounded-lg p-3 border border-white/5 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-climate-cyan/10 cursor-pointer">
              <div className="absolute top-0 left-0 w-1 h-full bg-climate-cyan/70"></div>
              <h4 className="font-semibold text-sm mb-1 pl-2 text-white">{carrier.name}</h4>
              <p className="text-[10px] text-climate-cyan uppercase tracking-wider mb-2 pl-2 opacity-80">Coverage: {carrier.coverage_type}</p>
              
              <div className="flex items-start gap-2 bg-climate-bg/50 p-2 rounded text-[11px] text-gray-400 ml-2 border border-white/5">
                  <span className="mt-0.5 text-climate-cyan/50 flex-shrink-0">ℹ️</span>
                 <p className="leading-snug">{carrier.notes}</p>
              </div>
           </div>
         ))}
       </div>
    </div>
  );
}
