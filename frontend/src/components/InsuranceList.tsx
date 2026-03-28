export default function InsuranceList({ insurers }: { insurers: any[] }) {
  return (
    <div className="glass-panel p-5 flex flex-col gap-4 mb-20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
     <div className="flex items-center gap-2 text-climate-cyan mb-2 border-b border-climate-border pb-3">
       <span className="text-xl">🛡️</span>
       <h2 className="text-lg font-bold">Recommended Insurers</h2>
       <span className="text-[10px] text-gray-500 ml-auto">{insurers.length} matched</span>
     </div>

       <div className="flex flex-col gap-3">
         {insurers.map((carrier: any, idx: number) => {
           const matchScore = carrier.match_score;
           const isFairPlan = carrier.fair_plan;
           const matchColor = matchScore >= 70 ? '#06d6a0' : matchScore >= 45 ? '#ffba08' : '#6b7280';

           return (
             <div
               key={idx}
               className="bg-black/30 rounded-lg p-3 border border-white/5 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-climate-cyan/10 cursor-pointer"
             >
               {/* Accent bar */}
               <div
                 className="absolute top-0 left-0 w-1 h-full"
                 style={{ background: isFairPlan ? '#ef4444' : '#00d4ff88' }}
               />

               <div className="flex items-center justify-between mb-1 pl-2">
                 <div className="flex items-center gap-2">
                   <h4 className="font-semibold text-sm text-white">{carrier.name}</h4>
                   {isFairPlan && (
                     <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-bold uppercase">
                       Last Resort
                     </span>
                   )}
                 </div>
                 {matchScore !== undefined && (
                   <div className="flex items-center gap-1.5">
                     <div
                       className="h-1.5 rounded-full"
                       style={{
                         width: 40,
                         background: 'rgba(255,255,255,0.1)',
                         position: 'relative',
                         overflow: 'hidden',
                       }}
                     >
                       <div
                         style={{
                           width: `${matchScore}%`,
                           height: '100%',
                           borderRadius: 4,
                           background: matchColor,
                           transition: 'width 0.5s ease',
                         }}
                       />
                     </div>
                     <span className="text-[9px] font-mono" style={{ color: matchColor }}>
                       {matchScore}%
                     </span>
                   </div>
                 )}
               </div>

               <p className="text-[10px] text-climate-cyan uppercase tracking-wider mb-2 pl-2 opacity-80">
                 Coverage: {carrier.coverage_type}
               </p>

               <div className="flex items-start gap-2 bg-climate-bg/50 p-2 rounded text-[11px] text-gray-400 ml-2 border border-white/5">
                 <span className="mt-0.5 text-climate-cyan/50 flex-shrink-0">ℹ️</span>
                 <p className="leading-snug">{carrier.notes}</p>
               </div>
             </div>
           );
         })}
       </div>
    </div>
  );
}
