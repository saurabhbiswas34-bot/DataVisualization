import { Link } from 'react-router-dom';
import { formatAddress } from '../utils/formatAddress';
import { formatIOTA } from '../utils/formatIOTA';
import { formatDateTime } from '../utils/timeUtils';
import { nanosToUSD } from '../utils/priceCalc';
import { useIotaPrice } from '../hooks/useIotaPrice';
import type { ParsedGame } from '../types';

export default function HistoryCard({ game }: { game: ParsedGame }) {
  const { priceUSD } = useIotaPrice();
  const potUSD = nanosToUSD(game.potNanos, priceUSD);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-gray-700 transition-colors">
      <div className="min-w-[80px]">
        <div className="text-amber-400 font-bold text-2xl">#{game.gameId}</div>
        <div className="text-gray-500 text-xs">{game.revealedAtMs ? formatDateTime(game.revealedAtMs) : '—'}</div>
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold">{game.potIOTA.toFixed(2)} IOTA</span>
          <span className="text-gray-500 text-sm">${potUSD.toFixed(2)} USD</span>
          <span className="text-gray-500 text-sm">· {game.players.length} players</span>
        </div>
        <div className="flex gap-3 flex-wrap text-xs">
          {game.winner1 && <span className="text-amber-400">🥇 {formatAddress(game.winner1)} ({formatIOTA(game.prize1Nanos, 2)} IOTA)</span>}
          {game.winner2 && <span className="text-gray-300">🥈 {formatAddress(game.winner2)}</span>}
          {game.winner3 && <span className="text-orange-400">🥉 {formatAddress(game.winner3)}</span>}
        </div>
      </div>
      <Link
        to={`/history/${game.objectId}`}
        className="text-teal-400 hover:text-teal-300 text-sm font-medium whitespace-nowrap transition-colors"
      >
        View Details →
      </Link>
    </div>
  );
}
