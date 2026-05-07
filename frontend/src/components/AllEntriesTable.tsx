import { formatAddress } from '../utils/formatAddress';
import type { ParsedGame } from '../types';

export default function AllEntriesTable({ game }: { game: ParsedGame }) {
  const winnerMap: Record<string, string> = {};
  if (game.winner1) winnerMap[game.winner1] = '🥇 1st';
  if (game.winner2) winnerMap[game.winner2] = '🥈 2nd';
  if (game.winner3) winnerMap[game.winner3] = '🥉 3rd';

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-white font-semibold">All Entries — Pot #{game.gameId}</h3>
        <p className="text-gray-500 text-xs mt-0.5">{game.players.length} unique players · all data permanently on-chain</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Wallet Address</th>
              <th className="text-center px-4 py-2">Draw Slot</th>
              <th className="text-center px-4 py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {game.players.map((addr, i) => (
              <tr key={addr} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2.5 font-mono text-teal-400">{formatAddress(addr)}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="bg-amber-400/10 text-amber-400 text-xs px-2 py-0.5 rounded-full" title="1 draw slot per unique address regardless of contribution amount">🎫 1</span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  {winnerMap[addr]
                    ? <span className="font-semibold text-amber-400">{winnerMap[addr]}</span>
                    : <span className="text-gray-600">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
