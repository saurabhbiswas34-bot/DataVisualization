import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { msToCountdown, getGameStatus } from '../utils/timeUtils';
import { useIotaPrice } from '../hooks/useIotaPrice';
import { nanosToUSD } from '../utils/priceCalc';
import type { ParsedGame } from '../types';

const statusConfig = {
  open: { label: 'OPEN', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  locked: { label: 'LOCKED', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  revealed: { label: 'REVEALED', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  history: { label: 'COMPLETED', cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

export default function PotCard({ game }: { game: ParsedGame }) {
  const [now, setNow] = useState(Date.now());
  const { priceUSD } = useIotaPrice();
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const status = getGameStatus(game);
  const cfg = statusConfig[status];
  const remaining = Math.max(0, game.revealTimestampMs - now);
  const potUSD = nanosToUSD(game.potNanos, priceUSD);
  const isLocked = status === 'locked';

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 hover:border-amber-400/50 transition-colors flex flex-col gap-4 ${isLocked ? 'border-orange-500/50' : 'border-gray-800'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-white font-bold text-xl">Pot #{game.gameId}</h3>
          <p className="text-gray-500 text-sm mt-0.5">{game.players.length} unique player{game.players.length !== 1 ? 's' : ''}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
      </div>

      <div>
        <p className="text-amber-400 font-bold text-2xl">{game.potIOTA.toFixed(2)} IOTA</p>
        <p className="text-gray-500 text-sm">${potUSD.toFixed(2)} USD</p>
      </div>

      {game.isActive && (
        <div>
          {isLocked ? (
            <p className="text-orange-400 text-sm font-medium animate-pulse">🔒 Entries locked — revealing soon</p>
          ) : (
            <p className={`font-mono text-lg font-bold ${remaining < 3_600_000 ? 'text-red-400' : 'text-teal-400'}`}>
              {msToCountdown(remaining)}
            </p>
          )}
        </div>
      )}

      <Link
        to={status === 'revealed' || status === 'history' ? `/game/${game.objectId}/results` : `/game/${game.objectId}`}
        className={`mt-auto text-center py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
          isLocked
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-teal-500 hover:bg-teal-400 text-gray-950'
        }`}
      >
        {status === 'open' ? 'Enter Pot →' : status === 'locked' ? 'Locked' : 'View Results →'}
      </Link>
    </div>
  );
}
