import { LOCKOUT_DURATION_MS, HISTORY_THRESHOLD_MS } from '../networkConfig';
import type { ParsedGame } from '../types';

export function msToCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00:00';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(d).padStart(2, '0')}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getGameStatus(game: ParsedGame): 'open' | 'locked' | 'revealed' | 'history' {
  if (!game.isActive) {
    const revealedAt = game.revealedAtMs ?? 0;
    if (Date.now() > revealedAt + HISTORY_THRESHOLD_MS) return 'history';
    return 'revealed';
  }
  if (Date.now() >= game.lockoutTimestampMs) return 'locked';
  return 'open';
}

export function isRevealTime(game: ParsedGame): boolean {
  return game.isActive && Date.now() >= game.revealTimestampMs;
}

export function isInHistory(game: ParsedGame): boolean {
  return getGameStatus(game) === 'history';
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

// Re-export to avoid unused import warning
export { LOCKOUT_DURATION_MS };
