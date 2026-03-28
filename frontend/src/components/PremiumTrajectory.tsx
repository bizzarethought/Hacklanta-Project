import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function PremiumTrajectory({ data, currentYear }: { data: any[], currentYear: number }) {
  const chartData = data.map((d: any) => ({
      ...d,
      active: d.year <= currentYear
  }));

  return (
    <div className="glass-panel p-5 flex flex-col gap-3 h-64">
        <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-widest">Long-Term Premium Trajectory</h3>
            <p className="text-[10px] text-gray-500">Unmitigated baseline projection (2024-2044)</p>
        </div>
        
        <div className="flex-1 w-full -ml-4 mt-2">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} tickFormatter={(val: any) => `$${val/1000}k`} width={40} />
                  <Tooltip 
                     cursor={{fill: 'rgba(255,255,255,0.05)'}}
                     contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}}
                     formatter={(value: number) => [`$${value.toLocaleString()}`, 'Projected Premium']}
                     itemStyle={{color: '#00d4ff'}}
                  />
                  <Bar dataKey="premium" radius={[4, 4, 0, 0]}>
                     {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.active ? '#00d4ff' : '#1e293b'} style={{transition: 'fill 0.3s ease'}} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}
