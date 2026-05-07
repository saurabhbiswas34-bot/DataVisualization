import { formatAddress } from '../utils/formatAddress';
import { useIotaPrice } from '../hooks/useIotaPrice';
import type { ParsedGame } from '../types';

export default function PlayersList({ game }: { game: ParsedGame }) {
  const { priceUSD: _priceUSD } = useIotaPrice();
  const playerCount = game.players.length;

  if (playerCount === 0) {
    return <p className="text-gray-500 text-sm text-center py-4">No players yet — be the first!</p>;
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-white font-semibold">Players ({playerCount} unique)</h3>
        <span className="text-gray-500 text-xs">1 draw slot per address · equal chance regardless of amount</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Address</th>
              <th className="text-right px-4 py-2">Contributed</th>
              <th className="text-center px-4 py-2">Draw Slot</th>
            </tr>
          </thead>
          <tbody>
            {game.players.map((addr, i) => (
              <tr key={addr} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2.5 font-mono text-teal-400">{formatAddress(addr)}</td>
                <td className="px-4 py-2.5 text-right text-white">
                  — IOTA <span className="text-gray-500 text-xs">(live from chain)</span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="bg-amber-400/10 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-400/20">🎫 1</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-800/30 text-gray-500 text-xs text-center">
        Each unique address receives exactly 1 draw slot regardless of contribution amount — additional contributions increase the pot, not the odds
      </div>
    </div>
  );
}
