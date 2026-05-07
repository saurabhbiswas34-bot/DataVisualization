import { useState } from 'react';
import { useActiveGames } from '../hooks/useActiveGames';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAutoReveal } from '../hooks/useAutoReveal';
import { msToCountdown, getGameStatus } from '../utils/timeUtils';

export default function RevealWatcher() {
  const { activeGames } = useActiveGames();
  const { isAdmin } = useIsAdmin();
  const [revealLog, setRevealLog] = useState<string[]>([]);

  useAutoReveal(
    activeGames,
    isAdmin,
    (gameId) => setRevealLog(l => [`⏳ Revealing Pot #${gameId}...`, ...l.slice(0, 4)]),
    (gameId) => setRevealLog(l => [`✓ Pot #${gameId} revealed!`, ...l.slice(0, 4)]),
    (gameId, err) => setRevealLog(l => [`✗ Pot #${gameId} reveal failed: ${err}`, ...l.slice(0, 4)]),
  );

  const now = Date.now();
  const gamesWithTime = activeGames.map(g => ({
    ...g,
    remaining: Math.max(0, g.revealTimestampMs - now),
    status: getGameStatus(g),
  })).sort((a, b) => a.remaining - b.remaining);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">🤖 Auto-Reveal Watcher</h3>
        <div className="flex items-center gap-2 text-sm">
          {isAdmin
            ? <><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-green-400">ACTIVE</span></>
            : <><span className="w-2 h-2 rounded-full bg-gray-500" /><span className="text-gray-500">Admin wallet not connected</span></>}
        </div>
      </div>

      {gamesWithTime.length === 0 ? (
        <p className="text-gray-500 text-sm">No active games to watch</p>
      ) : (
        <div className="space-y-2">
          {gamesWithTime.map(g => (
            <div key={g.objectId} className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${g.remaining < 300_000 ? 'bg-red-500/10 border border-red-500/20' : 'bg-gray-800/50'}`}>
              <span className="text-gray-300">Pot #{g.gameId}</span>
              <span className={`font-mono ${g.remaining < 300_000 ? 'text-red-400 font-bold' : 'text-teal-400'}`}>
                {g.remaining === 0 ? '⚡ NOW' : msToCountdown(g.remaining)}
                {g.remaining < 300_000 && g.remaining > 0 ? ' ⚡ IMMINENT' : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {revealLog.length > 0 && (
        <div className="border-t border-gray-800 pt-3 space-y-1">
          <p className="text-gray-500 text-xs font-medium">Recent Activity</p>
          {revealLog.map((log, i) => (
            <p key={i} className={`text-xs ${log.startsWith('✓') ? 'text-green-400' : log.startsWith('✗') ? 'text-red-400' : 'text-gray-400'}`}>{log}</p>
          ))}
        </div>
      )}
    </div>
  );
}
