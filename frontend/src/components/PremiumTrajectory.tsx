import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Line, ComposedChart, Area } from 'recharts';

export default function PremiumTrajectory({ data, currentYear }: { data: any[], currentYear: number }) {
  // Support both old format (no mitigated) and new format
  const hasMitigated = data.length > 0 && data[0].mitigated_premium !== undefined;

  const chartData = data.map((d: any) => ({
    ...d,
    active: d.year <= currentYear,
    savings: hasMitigated ? d.premium - d.mitigated_premium : 0,
  }));

  const maxPremium = Math.max(...data.map((d: any) => d.premium));
  const lastYear = data[data.length - 1];
  const firstYear = data[0];
  const totalIncrease = lastYear && firstYear
    ? Math.round(((lastYear.premium - firstYear.premium) / firstYear.premium) * 100)
    : 0;

  return (
    <div className="glass-panel p-5 flex flex-col gap-3 shrink-0" style={{ minHeight: 280 }}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs text-gray-400 uppercase tracking-widest">Long-Term Premium Trajectory</h3>
          <p className="text-[10px] text-gray-500">
            {data.length > 10 ? '20-year projection (2024–2044)' : '5-year projection'}
          </p>
        </div>
        {totalIncrease > 0 && (
          <div className="text-right">
            <p className="text-lg font-black text-red-400">+{totalIncrease}%</p>
            <p className="text-[9px] text-gray-500 uppercase">total increase</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {hasMitigated && (
        <div className="flex gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#00d4ff' }} />
            <span className="text-gray-400">Unmitigated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#06d6a0' }} />
            <span className="text-gray-400">With Improvements</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(6,214,160,0.15)' }} />
            <span className="text-gray-400">Savings</span>
          </div>
        </div>
      )}

      <div className="w-full -ml-4 mt-1" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 9 }}
              interval={data.length > 10 ? 4 : 0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 9 }}
              tickFormatter={(val: any) => `$${(val / 1000).toFixed(0)}k`}
              width={45}
              domain={[0, maxPremium * 1.1]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: 11,
              }}
              formatter={(value: number, name: string) => {
                const label = name === 'premium' ? 'Unmitigated' :
                              name === 'mitigated_premium' ? 'With Improvements' : 'Savings';
                return [`$${value.toLocaleString()}`, label];
              }}
              itemStyle={{ color: '#ccc' }}
            />

            {/* Savings area between the two lines */}
            {hasMitigated && (
              <Area
                dataKey="savings"
                fill="rgba(6,214,160,0.08)"
                stroke="none"
                baseLine={0}
              />
            )}

            {/* Unmitigated premium bars */}
            <Bar dataKey="premium" radius={[3, 3, 0, 0]} barSize={data.length > 10 ? 8 : 20}>
              {chartData.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.active ? '#00d4ff' : '#1e293b'}
                  style={{ transition: 'fill 0.3s ease' }}
                />
              ))}
            </Bar>

            {/* Mitigated premium line */}
            {hasMitigated && (
              <Line
                dataKey="mitigated_premium"
                type="monotone"
                stroke="#06d6a0"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom stats */}
      {hasMitigated && lastYear && (
        <div className="flex justify-between text-[10px] text-gray-400 border-t border-climate-border pt-2">
          <span>
            2044 unmitigated: <span className="text-red-400 font-bold">${lastYear.premium.toLocaleString()}</span>
          </span>
          <span>
            2044 mitigated: <span className="text-green-400 font-bold">${lastYear.mitigated_premium.toLocaleString()}</span>
          </span>
        </div>
      )}
    </div>
  );
}
