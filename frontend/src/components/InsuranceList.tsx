export default function InsuranceList({ insurers }: { insurers: any[] }) {
  return (
    <div className="glass-panel p-5 flex flex-col gap-4 mb-20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
     <div className="flex items-center gap-2 text-climate-cyan mb-1 border-b border-climate-border pb-3">
       <i className="fa-solid fa-shield-halved text-sm" />
       <h2 className="text-lg font-bold">Recommended Insurers</h2>
       <span className="text-[10px] text-gray-500 ml-auto font-mono">{insurers.length} matched</span>
     </div>

       <div className="flex flex-col gap-3">
         {insurers.map((carrier: any, idx: number) => {
           const matchScore = carrier.match_score;
           const isFairPlan = carrier.fair_plan;
           const matchColor = matchScore >= 70 ? '#06d6a0' : matchScore >= 45 ? '#ffba08' : '#6b7280';

           return (
             <div
               key={idx}
               className="bg-black/30 rounded-lg p-3 border border-white/5 relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-900/20 cursor-pointer"
             >
               {/* Left accent */}
               <div
                 className="absolute top-0 left-0 w-[3px] h-full rounded-r"
                 style={{ background: isFairPlan ? '#ef4444' : '#00d4ff70' }}
               />

               <div className="flex items-center justify-between mb-1 pl-2.5">
                 <div className="flex items-center gap-2">
                   <h4 className="font-semibold text-sm text-white">{carrier.name}</h4>
                   {isFairPlan && (
                     <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/12 text-red-400 border border-red-500/25 font-bold uppercase tracking-wider flex items-center gap-1">
                       <i className="fa-solid fa-circle-exclamation text-[7px]" />
                       Last Resort
                     </span>
                   )}
                 </div>
                 {matchScore !== undefined && (
                   <div className="flex items-center gap-1.5">
                     <div
                       style={{
                         width: 36, height: 5, borderRadius: 3,
                         background: 'rgba(255,255,255,0.08)',
                         overflow: 'hidden',
                       }}
                     >
                       <div style={{
                         width: `${matchScore}%`, height: '100%',
                         borderRadius: 3, background: matchColor,
                         transition: 'width 0.5s ease',
                       }} />
                     </div>
                     <span className="text-[9px] font-mono tabular-nums" style={{ color: matchColor }}>
                       {matchScore}%
                     </span>
                   </div>
                 )}
               </div>

               <p className="text-[10px] text-climate-cyan/70 uppercase tracking-wider mb-2 pl-2.5">
                 <i className="fa-solid fa-file-shield text-[8px] mr-1" />
                 {carrier.coverage_type}
               </p>

               <div className="flex items-start gap-2 bg-white/[0.025] p-2 rounded text-[11px] text-gray-400 ml-2.5 border border-white/[0.04]">
                 <i className="fa-solid fa-circle-info text-[9px] mt-0.5 text-cyan-700 flex-shrink-0" />
                 <p className="leading-snug">{carrier.notes}</p>
               </div>
             </div>
           );
         })}
       </div>
    </div>
  );
}
