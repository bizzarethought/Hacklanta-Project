import { useEffect, useRef, useState } from 'react';

type Hazard = 'flood' | 'fire' | 'wind' | 'seismic' | 'heat';

interface Props {
  hazard: Hazard;
  onDone: () => void;
}

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  dur: number;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeParticles(hazard: Hazard): Particle[] {
  switch (hazard) {
    case 'flood':
      return Array.from({ length: 35 }, (_, i) => ({
        id: i,
        emoji: ['💧', '💧', '💧', '🌊'][i % 4],
        x: -8,
        y: rand(5, 90),
        size: rand(22, 40),
        delay: rand(0, 3500),
        dur: rand(2000, 3500),
      }));

    case 'fire':
      return Array.from({ length: 30 }, (_, i) => ({
        id: i,
        emoji: '🔥',
        x: rand(30, 70),
        y: 105,
        size: rand(28, 52),
        delay: rand(0, 2500),
        dur: rand(1800, 3000),
      }));

    case 'wind':
      return Array.from({ length: 20 }, (_, i) => ({
        id: i,
        emoji: ['🌬️', '☁️', '🌫️'][i % 3],
        x: -15,
        y: rand(5, 90),
        size: rand(32, 56),
        delay: rand(0, 1500),
        dur: rand(700, 1400),
      }));

    case 'seismic':
      return Array.from({ length: 18 }, (_, i) => ({
        id: i,
        emoji: '💥',
        x: rand(5, 90),
        y: rand(5, 90),
        size: rand(28, 54),
        delay: rand(0, 3000),
        dur: rand(600, 1200),
      }));

    case 'heat':
      return Array.from({ length: 22 }, (_, i) => ({
        id: i,
        emoji: '☀️',
        x: rand(5, 90),
        y: rand(5, 90),
        size: rand(28, 60),
        delay: rand(0, 3500),
        dur: rand(1500, 3000),
      }));
  }
}

export default function DisasterSim({ hazard, onDone }: Props) {
  const [particles] = useState(() => makeParticles(hazard));
  const [visible, setVisible] = useState(true);

  // Screen shake for earthquake
  useEffect(() => {
    if (hazard !== 'seismic') return;
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes cg-quake {
        0%,100%{transform:translate(0,0) rotate(0deg)}
        10%{transform:translate(-8px,4px) rotate(-1deg)}
        20%{transform:translate(8px,-6px) rotate(1deg)}
        30%{transform:translate(-10px,2px) rotate(0.5deg)}
        40%{transform:translate(6px,8px) rotate(-1.5deg)}
        50%{transform:translate(-6px,-4px) rotate(1deg)}
        60%{transform:translate(10px,6px) rotate(-0.5deg)}
        70%{transform:translate(-4px,-8px) rotate(1.5deg)}
        80%{transform:translate(8px,4px) rotate(-1deg)}
        90%{transform:translate(-8px,6px) rotate(0.5deg)}
      }
      .cg-shake { animation: cg-quake 0.15s linear infinite; }
    `;
    document.head.appendChild(style);
    document.body.classList.add('cg-shake');
    return () => {
      document.body.classList.remove('cg-shake');
      document.head.removeChild(style);
    };
  }, [hazard]);

  // Auto-close after 5s
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 400); }, 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  const animStyle = () => {
    switch (hazard) {
      case 'flood': return `
        @keyframes cg-ltr {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(115vw); opacity: 0.8; }
        }`;
      case 'fire': return `
        @keyframes cg-rise {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
        }`;
      case 'wind': return `
        @keyframes cg-fast-ltr {
          from { transform: translateX(0) scaleX(1); opacity: 1; }
          to   { transform: translateX(120vw) scaleX(1.2); opacity: 0; }
        }`;
      case 'seismic': return `
        @keyframes cg-pop {
          0%   { transform: scale(0); opacity: 1; }
          40%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }`;
      case 'heat': return `
        @keyframes cg-fade-heat {
          0%   { opacity: 0; transform: scale(0.7); }
          30%  { opacity: 1; transform: scale(1.1); }
          70%  { opacity: 0.8; }
          100% { opacity: 0; transform: scale(1.3); }
        }`;
    }
  };

  const animName = {
    flood: 'cg-ltr',
    fire: 'cg-rise',
    wind: 'cg-fast-ltr',
    seismic: 'cg-pop',
    heat: 'cg-fade-heat',
  }[hazard];

  const overlay = hazard === 'heat' ? 'rgba(200,80,0,0.35)' : 'transparent';

  return (
    <>
      <style>{`
        ${animStyle()}
        @keyframes cg-fadein  { from{opacity:0} to{opacity:1} }
        @keyframes cg-fadeout { from{opacity:1} to{opacity:0} }
      `}</style>

      <div
        onClick={() => { setVisible(false); setTimeout(onDone, 300); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: overlay,
          overflow: 'hidden',
          cursor: 'pointer',
          animation: `${visible ? 'cg-fadein' : 'cg-fadeout'} 0.35s ease forwards`,
          pointerEvents: 'all',
        }}
      >
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: hazard === 'flood' || hazard === 'wind' ? `${p.x}%` : `${p.x}%`,
              top: `${p.y}%`,
              fontSize: p.size,
              lineHeight: 1,
              animation: `${animName} ${p.dur}ms ${p.delay}ms ease-in ${
                hazard === 'seismic' ? 'forwards' : 'infinite'
              }`,
              userSelect: 'none',
              pointerEvents: 'none',
              opacity: hazard === 'heat' ? 0 : 1,
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>
    </>
  );
}
