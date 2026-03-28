import { useState, useEffect } from 'react';

const LOADING_STEPS = [
  { label: 'Initializing risk engine',        icon: 'fa-solid fa-microchip',       delay: 0 },
  { label: 'Connecting to FEMA NFHL',         icon: 'fa-solid fa-water',           delay: 400 },
  { label: 'Loading seismic data (USGS)',      icon: 'fa-solid fa-mountain',       delay: 800 },
  { label: 'Syncing wildfire feeds (NASA)',    icon: 'fa-solid fa-fire',            delay: 1200 },
  { label: 'Building insurer database',       icon: 'fa-solid fa-shield-halved',   delay: 1600 },
  { label: 'Calibrating heatmap layers',      icon: 'fa-solid fa-layer-group',     delay: 2000 },
  { label: 'Platform ready',                  icon: 'fa-solid fa-circle-check',    delay: 2500 },
];

export default function LoadingTransition({ onComplete }: { onComplete: () => void }) {
  const [activeStep, setActiveStep] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Stagger step reveals
    const timers = LOADING_STEPS.map((step, i) =>
      setTimeout(() => setActiveStep(i), step.delay)
    );

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 1.2;
      });
    }, 30);

    // Exit after all steps
    const exitTimer = setTimeout(() => setExiting(true), 3000);
    const completeTimer = setTimeout(onComplete, 3600);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: '#050a18',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      {/* Scanning line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)',
          animation: 'scan-line 2s ease-in-out infinite',
        }} />
      </div>

      <div className="flex flex-col items-center gap-8 px-6 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <i className="fa-solid fa-shield-halved text-2xl text-climate-cyan" style={{
            filter: 'drop-shadow(0 0 12px rgba(0,212,255,0.6))',
            animation: 'logo-pulse 1.5s ease-in-out infinite',
          }} />
          <span className="text-xl font-bold tracking-wider text-white">
            CLIMATE<span className="text-climate-cyan font-light">GUARD</span>
          </span>
        </div>

        {/* Step list */}
        <div className="w-full flex flex-col gap-2">
          {LOADING_STEPS.map((step, i) => {
            const isActive = i <= activeStep;
            const isCurrent = i === activeStep;
            const isLast = i === LOADING_STEPS.length - 1;

            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300"
                style={{
                  opacity: isActive ? 1 : 0.15,
                  transform: isActive ? 'translateX(0)' : 'translateX(-8px)',
                  background: isCurrent ? 'rgba(0,212,255,0.05)' : 'transparent',
                  borderLeft: isCurrent ? '2px solid rgba(0,212,255,0.5)' : '2px solid transparent',
                }}
              >
                <i
                  className={step.icon}
                  style={{
                    fontSize: 11,
                    width: 16,
                    textAlign: 'center',
                    color: isLast && isActive ? '#06d6a0' : isActive ? '#00d4ff' : '#374151',
                    transition: 'color 0.3s',
                  }}
                />
                <span style={{
                  fontSize: 12,
                  color: isLast && isActive ? '#06d6a0' : isActive ? '#d1d5db' : '#374151',
                  fontWeight: isCurrent ? 600 : 400,
                  fontFamily: 'monospace',
                  transition: 'color 0.3s',
                }}>
                  {step.label}
                </span>
                {isCurrent && !isLast && (
                  <i className="fa-solid fa-spinner fa-spin text-[9px] text-climate-cyan/60 ml-auto" />
                )}
                {isActive && !isCurrent && (
                  <i className="fa-solid fa-check text-[9px] text-climate-cyan/40 ml-auto" />
                )}
                {isLast && isActive && (
                  <i className="fa-solid fa-check text-[9px] text-green-400 ml-auto" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="w-full h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: progress >= 100
                  ? 'linear-gradient(90deg, #06d6a0, #00d4ff)'
                  : 'linear-gradient(90deg, #00d4ff, #0099cc)',
                transition: 'width 0.05s linear, background 0.3s',
                boxShadow: '0 0 8px rgba(0,212,255,0.4)',
              }}
            />
          </div>
          <p className="text-[9px] text-gray-600 text-center mt-2 font-mono tracking-wider">
            {progress >= 100 ? 'READY' : `${Math.min(Math.round(progress), 100)}%`}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes logo-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
