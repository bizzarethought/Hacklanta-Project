const LAYER_INFO: Record<string, { label: string; icon: string; color: string }> = {
  flood:     { label: 'Flood',     icon: 'fa-solid fa-water',          color: '#00b4d8' },
  fire:      { label: 'Wildfire',  icon: 'fa-solid fa-fire',           color: '#ff6b35' },
  wind:      { label: 'Wind',      icon: 'fa-solid fa-wind',           color: '#c77dff' },
  heat:      { label: 'Heat',      icon: 'fa-solid fa-temperature-high', color: '#ffba08' },
  seismic:   { label: 'Seismic',   icon: 'fa-solid fa-mountain',       color: '#06d6a0' },
  disasters: { label: 'Disasters', icon: 'fa-solid fa-triangle-exclamation', color: '#ffd60a' },
};

const ALL_LAYER_IDS = ['flood', 'fire', 'wind', 'heat', 'seismic', 'disasters'] as const;

interface LayerVisibility {
  [key: string]: boolean;
}

export default function HeatmapControls({
  visibility,
  onToggle,
  onSetAll,
  opacity,
  onOpacityChange,
}: {
  visibility: LayerVisibility;
  onToggle: (id: string) => void;
  onSetAll: (visible: boolean) => void;
  opacity: number;
  onOpacityChange: (val: number) => void;
}) {
  const activeCount = ALL_LAYER_IDS.filter(id => visibility[id]).length;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 28,
        left: 14,
        background: 'rgba(8, 12, 28, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '12px 14px',
        color: 'white',
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        zIndex: 50,
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{
          fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#6b7280',
          fontWeight: 700,
        }}>
          <i className="fa-solid fa-layer-group" style={{ marginRight: 5, fontSize: 8, color: '#00d4ff' }} />
          Risk Layers
        </span>
        <span style={{
          fontSize: 9, background: 'rgba(0,212,255,0.12)', color: '#00d4ff',
          padding: '1px 7px', borderRadius: 8, fontWeight: 700,
        }}>
          {activeCount}
        </span>
      </div>

      {/* Toggle buttons */}
      {ALL_LAYER_IDS.map(id => {
        const info = LAYER_INFO[id];
        const active = visibility[id];
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: `1px solid ${active ? info.color + '40' : 'rgba(255,255,255,0.04)'}`,
              borderRadius: 7, padding: '6px 8px',
              cursor: 'pointer', transition: 'all 0.25s ease',
              color: active ? '#e5e7eb' : '#4b5563',
              outline: 'none',
            }}
          >
            <i
              className={info.icon}
              style={{
                fontSize: 11, width: 16, textAlign: 'center',
                color: active ? info.color : '#4b5563',
                transition: 'color 0.25s',
              }}
            />
            <span style={{
              flex: 1, textAlign: 'left', fontSize: 11, fontWeight: 500,
              transition: 'color 0.25s',
            }}>
              {info.label}
            </span>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: active ? info.color : 'rgba(255,255,255,0.1)',
              boxShadow: active ? `0 0 6px ${info.color}60` : 'none',
              transition: 'all 0.3s ease',
            }} />
          </button>
        );
      })}

      {/* Quick toggles */}
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        <button
          onClick={() => onSetAll(true)}
          style={{
            flex: 1, padding: '4px 0', borderRadius: 5, fontSize: 9,
            background: 'rgba(0,212,255,0.08)', color: '#00d4ff',
            border: '1px solid rgba(0,212,255,0.15)', cursor: 'pointer',
            fontWeight: 700, letterSpacing: 1, transition: 'all 0.2s', outline: 'none',
          }}
        >
          ALL
        </button>
        <button
          onClick={() => onSetAll(false)}
          style={{
            flex: 1, padding: '4px 0', borderRadius: 5, fontSize: 9,
            background: 'rgba(255,255,255,0.03)', color: '#6b7280',
            border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
            fontWeight: 700, letterSpacing: 1, transition: 'all 0.2s', outline: 'none',
          }}
        >
          NONE
        </button>
      </div>

      {/* Opacity control */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4b5563' }}>
          <span><i className="fa-solid fa-eye" style={{ marginRight: 4, fontSize: 8 }} />Intensity</span>
          <span>{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range" min="0.1" max="1" step="0.05" value={opacity}
          onChange={e => onOpacityChange(parseFloat(e.target.value))}
          style={{ width: '100%', height: 3, accentColor: '#00d4ff', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}
