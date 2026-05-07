import { useState, useEffect } from 'react';
import { msToCountdown } from '../utils/timeUtils';

interface Props {
  targetMs: number;
  label?: string;
  className?: string;
}

export default function CountdownTimer({ targetMs, label = 'Reveals In', className = '' }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, targetMs - now);
  const parts = msToCountdown(remaining).split(':');
  const isUrgent = remaining < 3_600_000;
  const isExpired = remaining === 0;

  return (
    <div className={`text-center ${className}`}>
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      {isExpired ? (
        <p className="text-amber-400 text-2xl font-bold animate-pulse">Revealing...</p>
      ) : (
        <div className="flex gap-2 justify-center">
          {['Days', 'Hrs', 'Min', 'Sec'].map((unit, i) => (
            <div key={unit} className="text-center">
              <div className={`text-3xl font-mono font-bold px-3 py-2 rounded-lg bg-gray-800 border ${isUrgent ? 'text-red-400 border-red-500/30' : 'text-white border-gray-700'}`}>
                {parts[i]}
              </div>
              <div className="text-gray-500 text-xs mt-1">{unit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
