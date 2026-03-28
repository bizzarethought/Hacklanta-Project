interface LayerState {
  id: string;
  visible: boolean;
}

const LAYER_INFO: Record<string, { label: string; icon: string; color: string }> = {
  flood:     { label: 'Flood',     icon: '🌊', color: '#00b4d8' },
  fire:      { label: 'Wildfire',  icon: '🔥', color: '#ff6b35' },
  wind:      { label: 'Wind',      icon: '💨', color: '#c77dff' },
  heat:      { label: 'Heat',      icon: '🌡️', color: '#ffba08' },
  seismic:   { label: 'Seismic',   icon: '🪨', color: '#06d6a0' },
  disasters: { label: 'Disasters', icon: '⚠️', color: '#ffd60a' },
};

export default function HeatmapControls({
  layers,
  onToggle,
  onSetAll,
  opacity,
  onOpacityChange,
}: {
  layers: LayerState[];
  onToggle: (id: string) => void;
  onSetAll: (visible: boolean) => void;
  opacity: number;
  onOpacityChange: (val: number) => void;
}) {
  const activeCount = layers.filter(l => l.visible).length;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 32,
        left: 16,
        background: 'rgba(10, 15, 30, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14,
        padding: '14px 16px',
        color: 'white',
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 195,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af',
          fontWeight: 600,
        }}>
          Risk Layers
        </span>
        <span style={{
          fontSize: 10, background: 'rgba(0,212,255,0.15)', color: '#00d4ff',
          padding: '2px 8px', borderRadius: 10, fontWeight: 700,
        }}>
          {activeCount}/{layers.length}
        </span>
      </div>

      {/* Layer toggles */}
      {layers.map(({ id, visible }) => {
        const info = LAYER_INFO[id];
        if (!info) return null;
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: visible ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: `1px solid ${visible ? info.color + '55' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 8, padding: '7px 10px',
              cursor: 'pointer', transition: 'all 0.2s ease',
              color: visible ? 'white' : '#6b7280',
            }}
          >
            <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{info.icon}</span>
            <span style={{
              flex: 1, textAlign: 'left', fontSize: 11, fontWeight: 500,
              transition: 'color 0.2s',
            }}>
              {info.label}
            </span>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: visible ? info.color : 'rgba(255,255,255,0.15)',
              boxShadow: visible ? `0 0 8px ${info.color}80` : 'none',
              transition: 'all 0.3s ease',
            }} />
          </button>
        );
      })}

      {/* Quick toggles */}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <button
          onClick={() => onSetAll(true)}
          style={{
            flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 10,
            background: 'rgba(0,212,255,0.1)', color: '#00d4ff',
            border: '1px solid rgba(0,212,255,0.2)', cursor: 'pointer',
            fontWeight: 600, letterSpacing: 1, transition: 'all 0.2s',
          }}
        >
          ALL
        </button>
        <button
          onClick={() => onSetAll(false)}
          style={{
            flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 10,
            background: 'rgba(255,255,255,0.05)', color: '#9ca3af',
            border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
            fontWeight: 600, letterSpacing: 1, transition: 'all 0.2s',
          }}
        >
          NONE
        </button>
      </div>

      {/* Opacity slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280' }}>
          <span>Intensity</span>
          <span>{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1" max="1" step="0.05"
          value={opacity}
          onChange={e => onOpacityChange(parseFloat(e.target.value))}
          style={{ width: '100%', height: 4, accentColor: '#00d4ff', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}
