import { useState } from 'react';
import ScoreCard from './ScoreCard';

export default function PropertyPanel({ data, year, onOverride }: {
  data: any;
  year: number;
  onOverride?: (field: string, value: any) => void;
}) {
  const currentRisk = Math.min(data.composite_score + ((year - 2024) * 0.5), 100);
  const propInfo = data.property_info;
  const disasters = data.disaster_history;

  const [editingValue, setEditingValue] = useState(false);
  const [editingPremium, setEditingPremium] = useState(false);
  const [tempValue, setTempValue] = useState(String(data.insured_value));
  const [tempPremium, setTempPremium] = useState(String(data.annual_premium_estimate));

  const buildingLabel = propInfo?.building_type || 'Residential Property';

  const buildingIcon: Record<string, string> = {
    'Single-Family Residential': 'fa-solid fa-house',
    'Multi-Family Residential': 'fa-solid fa-building',
    'Mobile/Manufactured Home': 'fa-solid fa-caravan',
    'Commercial': 'fa-solid fa-store',
    'Retail Trade': 'fa-solid fa-store',
    'Industrial': 'fa-solid fa-industry',
    'Agricultural': 'fa-solid fa-wheat-awn',
    'Government': 'fa-solid fa-landmark',
    'Educational': 'fa-solid fa-school',
    'Hospital/Medical': 'fa-solid fa-hospital',
  };
  const icon = buildingIcon[propInfo?.building_type || ''] || 'fa-solid fa-house';

  const sourceLabel = propInfo?.source === 'USACE NSI' ? 'USACE NSI' : propInfo?.source === 'user_input' ? 'Manual' : 'Est.';
  const sourceColor = propInfo?.source === 'USACE NSI' ? '#06d6a0' : propInfo?.source === 'user_input' ? '#ffba08' : '#6b7280';

  function submitValue() {
    setEditingValue(false);
    const val = parseInt(tempValue.replace(/[^0-9]/g, ''));
    if (!isNaN(val) && val > 0 && onOverride) onOverride('insured_value', val);
  }

  function submitPremium() {
    setEditingPremium(false);
    const val = parseInt(tempPremium.replace(/[^0-9]/g, ''));
    if (!isNaN(val) && val > 0 && onOverride) onOverride('user_premium', val);
  }

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 shrink-0">
      {/* Header — building type + address */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex gap-2 items-center text-gray-400 mb-1 text-xs">
            <i className={`${icon} text-[10px]`} style={{ color: sourceColor }} />
            <span>{buildingLabel}</span>
            <span
              className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
              style={{ background: sourceColor + '18', color: sourceColor, border: `1px solid ${sourceColor}30` }}
            >
              {sourceLabel}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">{data.address.split(',')[0]}</h2>
          <p className="text-sm text-gray-400">{data.address.split(',').slice(1).join(',').trim()}</p>
        </div>
        {data.fair_plan_stress && (
          <div className="glass-pill px-2.5 py-1 flex items-center gap-1.5 text-xs mt-1 border border-red-500/25" style={{ color: '#f87171' }}>
            <i className="fa-solid fa-circle-exclamation text-[10px]" />
            <span className="font-semibold">FAIR Plan</span>
          </div>
        )}
      </div>

      {/* Property specs */}
      {propInfo && (propInfo.num_stories || propInfo.year_built || propInfo.foundation_type) && (
        <div className="flex gap-1.5 flex-wrap">
          {propInfo.num_stories && (
            <span className="glass-pill px-2.5 py-1 text-[10px] text-gray-300 flex items-center gap-1">
              <i className="fa-solid fa-stairs text-[8px] text-gray-500" />
              {propInfo.num_stories} {propInfo.num_stories === 1 ? 'Story' : 'Stories'}
            </span>
          )}
          {propInfo.year_built && (
            <span className="glass-pill px-2.5 py-1 text-[10px] text-gray-300 flex items-center gap-1">
              <i className="fa-regular fa-calendar text-[8px] text-gray-500" />
              Built {propInfo.year_built}
            </span>
          )}
          {propInfo.foundation_type && (
            <span className="glass-pill px-2.5 py-1 text-[10px] text-gray-300 flex items-center gap-1">
              <i className="fa-solid fa-cubes text-[8px] text-gray-500" />
              {propInfo.foundation_type}
            </span>
          )}
        </div>
      )}

      {/* Editable value & premium */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="bg-white/[0.03] rounded-lg p-3 cursor-pointer hover:bg-white/[0.06] transition-all group border border-transparent hover:border-white/10"
          onClick={() => setEditingValue(true)}
        >
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5 font-semibold">
            <i className="fa-solid fa-house-chimney text-[8px]" />
            Insured Value
            <i className="fa-solid fa-pen text-[7px] opacity-0 group-hover:opacity-60 transition-opacity text-white ml-auto" />
          </p>
          {editingValue ? (
            <input
              autoFocus
              type="text"
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={submitValue}
              onKeyDown={e => e.key === 'Enter' && submitValue()}
              className="bg-transparent text-lg font-light text-white outline-none border-b border-cyan-500/50 w-full"
            />
          ) : (
            <p className="text-lg font-light text-white">${(data.insured_value).toLocaleString()}</p>
          )}
        </div>
        <div
          className="bg-white/[0.03] rounded-lg p-3 cursor-pointer hover:bg-white/[0.06] transition-all group border border-transparent hover:border-white/10"
          onClick={() => setEditingPremium(true)}
        >
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5 font-semibold">
            <i className="fa-solid fa-receipt text-[8px]" />
            Annual Premium
            <i className="fa-solid fa-pen text-[7px] opacity-0 group-hover:opacity-60 transition-opacity text-white ml-auto" />
          </p>
          {editingPremium ? (
            <input
              autoFocus
              type="text"
              value={tempPremium}
              onChange={e => setTempPremium(e.target.value)}
              onBlur={submitPremium}
              onKeyDown={e => e.key === 'Enter' && submitPremium()}
              className="bg-transparent text-lg font-light text-white outline-none border-b border-cyan-500/50 w-full"
            />
          ) : (
            <p className="text-lg font-light text-white">${(data.annual_premium_estimate).toLocaleString()}/yr</p>
          )}
        </div>
      </div>

      {/* Disaster history */}
      {disasters && disasters.total_declarations > 0 && (
        <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-semibold flex items-center gap-1.5">
            <i className="fa-solid fa-triangle-exclamation text-[8px] text-yellow-500/70" />
            Disaster History — {data.state}
          </p>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-yellow-400">{disasters.total_declarations}</span>
              <span className="text-[10px] text-gray-500">declarations (20yr)</span>
            </div>
            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
              disasters.trend === 'increasing' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              disasters.trend === 'stable' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
              'bg-green-500/10 text-green-400 border border-green-500/20'
            }`}>
              <i className={`fa-solid ${
                disasters.trend === 'increasing' ? 'fa-arrow-trend-up' :
                disasters.trend === 'stable' ? 'fa-minus' : 'fa-arrow-trend-down'
              } text-[8px] mr-1`} />
              {disasters.trend}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(disasters.by_type || {}).slice(0, 4).map(([type, count]: [string, any]) => (
              <span key={type} className="text-[10px] text-gray-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                {type}: <span className="text-white font-semibold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Score breakdown */}
      <div className="mt-1 pt-3 border-t border-climate-border">
        <ScoreCard score={Math.min(currentRisk, 100)} hazards={data.hazards} />
      </div>
    </div>
  );
}
