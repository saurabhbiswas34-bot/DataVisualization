import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { msToCountdown, getGameStatus, isRevealTime, isInHistory, formatDateTime } from '../../utils/timeUtils';
import { makeGame, makeRevealedGame, makeHistoryGame, NOW, REVEAL_MS, LOCKOUT_MS } from '../../test-utils/factories';

describe('msToCountdown', () => {
  it('returns 00:00:00:00 for 0 or negative ms', () => {
    expect(msToCountdown(0)).toBe('00:00:00:00');
    expect(msToCountdown(-1)).toBe('00:00:00:00');
  });

  it('formats 1 day correctly', () => {
    expect(msToCountdown(86_400_000)).toBe('01:00:00:00');
  });

  it('formats 1 hour correctly', () => {
    expect(msToCountdown(3_600_000)).toBe('00:01:00:00');
  });

  it('formats 1 minute correctly', () => {
    expect(msToCountdown(60_000)).toBe('00:00:01:00');
  });

  it('formats 1 second correctly', () => {
    expect(msToCountdown(1_000)).toBe('00:00:00:01');
  });

  it('formats complex duration', () => {
    // 2d 3h 45m 10s
    const ms = 2 * 86_400_000 + 3 * 3_600_000 + 45 * 60_000 + 10_000;
    expect(msToCountdown(ms)).toBe('02:03:45:10');
  });

  it('pads single digits', () => {
    expect(msToCountdown(1_000)).toBe('00:00:00:01');
  });
});

describe('getGameStatus', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "open" for an active game before lockout', () => {
    const game = makeGame({ lockoutTimestampMs: NOW + 10_000, revealTimestampMs: NOW + 620_000 });
    expect(getGameStatus(game)).toBe('open');
  });

  it('returns "locked" for an active game past lockout but before reveal', () => {
    const game = makeGame({ lockoutTimestampMs: NOW - 1_000, revealTimestampMs: NOW + 10_000 });
    expect(getGameStatus(game)).toBe('locked');
  });

  it('returns "revealed" for inactive game revealed recently', () => {
    const game = makeRevealedGame({ revealedAtMs: NOW - 3_600_000 });
    expect(getGameStatus(game)).toBe('revealed');
  });

  it('returns "history" for inactive game revealed more than 3 days ago', () => {
    const game = makeHistoryGame();
    expect(getGameStatus(game)).toBe('history');
  });

  it('returns "revealed" when revealedAtMs is null (missing field treated as recent)', () => {
    // A missing revealedAtMs should NOT default to epoch-0 (which would make
    // every such game immediately "history"). Treat as "revealed" instead.
    const game = makeGame({ isActive: false, revealedAtMs: null });
    expect(getGameStatus(game)).toBe('revealed');
  });
});

describe('isRevealTime', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when reveal time has passed and game is active', () => {
    const game = makeGame({ revealTimestampMs: NOW - 1_000 });
    expect(isRevealTime(game)).toBe(true);
  });

  it('returns false when reveal time has not passed', () => {
    const game = makeGame({ revealTimestampMs: NOW + 1_000 });
    expect(isRevealTime(game)).toBe(false);
  });

  it('returns false when game is not active', () => {
    const game = makeRevealedGame({ revealTimestampMs: NOW - 1_000 });
    expect(isRevealTime(game)).toBe(false);
  });
});

describe('isInHistory', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for a history game', () => {
    expect(isInHistory(makeHistoryGame())).toBe(true);
  });

  it('returns false for an active game', () => {
    expect(isInHistory(makeGame())).toBe(false);
  });

  it('returns false for a recently revealed game', () => {
    expect(isInHistory(makeRevealedGame())).toBe(false);
  });
});

describe('formatDateTime', () => {
  it('returns a non-empty string for a valid timestamp', () => {
    const result = formatDateTime(1_700_000_000_000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes year in the output', () => {
    const result = formatDateTime(new Date('2025-01-15T12:00:00Z').getTime());
    expect(result).toMatch(/2025/);
  });
});
