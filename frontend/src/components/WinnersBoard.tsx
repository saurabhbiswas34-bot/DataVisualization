import { formatAddress } from '../utils/formatAddress';
import { formatIOTA } from '../utils/formatIOTA';
import { nanosToUSD } from '../utils/priceCalc';
import { useIotaPrice } from '../hooks/useIotaPrice';
import type { ParsedGame } from '../types';

export default function WinnersBoard({ game }: { game: ParsedGame }) {
  const { priceUSD } = useIotaPrice();
  const winners = [
    { addr: game.winner1, nanos: game.prize1Nanos, place: 1, label: '1st Place', emoji: '🥇', cls: 'border-amber-400 bg-amber-400/5' },
    { addr: game.winner2, nanos: game.prize2Nanos, place: 2, label: '2nd Place', emoji: '🥈', cls: 'border-gray-400 bg-gray-400/5' },
    { addr: game.winner3, nanos: game.prize3Nanos, place: 3, label: '3rd Place', emoji: '🥉', cls: 'border-orange-600 bg-orange-600/5' },
  ].filter(w => w.addr);

  return (
    <div className="space-y-4">
      <h2 className="text-white font-bold text-2xl text-center">🏆 Winners</h2>
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        {winners.map(({ addr, nanos, label, emoji, cls }) => (
          <div key={addr} className={`flex-1 max-w-xs border-2 rounded-xl p-5 text-center ${cls}`}>
            <div className="text-4xl mb-2">{emoji}</div>
            <div className="text-gray-400 text-sm font-medium mb-1">{label}</div>
            <div className="text-white font-bold text-2xl">{formatIOTA(nanos)} IOTA</div>
            <div className="text-gray-500 text-sm">${nanosToUSD(nanos, priceUSD).toFixed(2)} USD</div>
            <div className="text-teal-400 font-mono text-sm mt-2">{formatAddress(addr!)}</div>
            <div className="text-green-400 text-xs mt-2">✓ Prize Sent</div>
          </div>
        ))}
      </div>
      {game.treasuryCutNanos > 0n && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <span className="text-gray-400">🏦 Admin Treasury: </span>
          <span className="text-white font-medium">{formatIOTA(game.treasuryCutNanos)} IOTA</span>
          <span className="text-gray-500 text-sm"> (gas deducted) ✓</span>
        </div>
      )}
    </div>
  );
}
