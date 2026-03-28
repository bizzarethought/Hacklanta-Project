import { useState } from 'react';
import ScoreCard from './ScoreCard';

const BUILDING_TYPES = [
  'Single-Family Residential', 'Multi-Family Residential', 'Mobile/Manufactured Home',
  'Commercial', 'Industrial', 'Agricultural', 'Government', 'Educational', 'Other'
];

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

  const buildingLabel = propInfo?.building_type || 'Unknown Property Type';
  const buildingIcon = {
    'Single-Family Residential': '🏠',
    'Multi-Family Residential': '🏢',
    'Mobile/Manufactured Home': '🏗️',
    'Commercial': '🏬',
    'Industrial': '🏭',
    'Agricultural': '🌾',
    'Government': '🏛️',
    'Educational': '🏫',
    'Retail Trade': '🏬',
    'Wholesale Trade': '📦',
    'Hospital/Medical': '🏥',
  }[propInfo?.building_type || ''] || '🏠';

  const sourceLabel = propInfo?.source === 'USACE NSI' ? 'USACE NSI' : propInfo?.source === 'user_input' ? 'User Input' : 'Default';
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
    <div className="glass-panel p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex gap-2 items-center text-gray-400 mb-1 text-sm">
            <span>{buildingIcon}</span>
            <span>{buildingLabel}</span>
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
              style={{ background: sourceColor + '20', color: sourceColor, border: `1px solid ${sourceColor}40` }}
            >
              {sourceLabel}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">{data.address.split(',')[0]}</h2>
          <p className="text-sm text-gray-400">{data.address.split(',').slice(1).join(',').trim()}</p>
        </div>
        {data.fair_plan_stress && (
          <div className="glass-pill px-3 py-1 flex items-center gap-1 text-climate-hazard-high text-xs mt-1 border border-red-500/30">
            <span>🚫</span> FAIR Plan
          </div>
        )}
      </div>

      {/* Property details row */}
      {propInfo && (propInfo.num_stories || propInfo.year_built || propInfo.foundation_type) && (
        <div className="flex gap-2 flex-wrap mt-1">
          {propInfo.num_stories && (
            <span className="glass-pill px-3 py-1 text-[10px] text-gray-300">
              {propInfo.num_stories} {propInfo.num_stories === 1 ? 'Story' : 'Stories'}
            </span>
          )}
          {propInfo.year_built && (
            <span className="glass-pill px-3 py-1 text-[10px] text-gray-300">
              Built {propInfo.year_built}
            </span>
          )}
          {propInfo.foundation_type && (
            <span className="glass-pill px-3 py-1 text-[10px] text-gray-300">
              {propInfo.foundation_type}
            </span>
          )}
        </div>
      )}

      {/* Editable value/premium fields */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div
          className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition group"
          onClick={() => setEditingValue(true)}
        >
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            Insured Value
            <span className="opacity-0 group-hover:opacity-100 transition text-climate-cyan">✏️</span>
          </p>
          {editingValue ? (
            <input
              autoFocus
              type="text"
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={submitValue}
              onKeyDown={e => e.key === 'Enter' && submitValue()}
              className="bg-transparent text-lg font-light text-white outline-none border-b border-climate-cyan w-full"
            />
          ) : (
            <p className="text-lg font-light text-white">${(data.insured_value).toLocaleString()}</p>
          )}
        </div>
        <div
          className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition group"
          onClick={() => setEditingPremium(true)}
        >
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            Annual Premium
            <span className="opacity-0 group-hover:opacity-100 transition text-climate-cyan">✏️</span>
          </p>
          {editingPremium ? (
            <input
              autoFocus
              type="text"
              value={tempPremium}
              onChange={e => setTempPremium(e.target.value)}
              onBlur={submitPremium}
              onKeyDown={e => e.key === 'Enter' && submitPremium()}
              className="bg-transparent text-lg font-light text-white outline-none border-b border-climate-cyan w-full"
            />
          ) : (
            <p className="text-lg font-light text-white">${(data.annual_premium_estimate).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Disaster history summary */}
      {disasters && (
        <div className="bg-white/5 rounded-lg p-3 mt-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Disaster History ({data.state})</p>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-yellow-400">{disasters.total_declarations}</span>
              <span className="text-[10px] text-gray-500">declarations (20yr)</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
              disasters.trend === 'increasing' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
              disasters.trend === 'stable' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
              'bg-green-500/15 text-green-400 border border-green-500/30'
            }`}>
              {disasters.trend === 'increasing' ? '↑ Increasing' :
               disasters.trend === 'stable' ? '→ Stable' : '↓ Decreasing'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(disasters.by_type || {}).slice(0, 4).map(([type, count]: [string, any]) => (
              <span key={type} className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded">
                {type}: <span className="text-white font-semibold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 pt-4 border-t border-climate-border">
        <ScoreCard score={Math.min(currentRisk, 100)} hazards={data.hazards} />
      </div>
    </div>
  );
}
