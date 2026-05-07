/**
 * Edge-case tests for timeUtils — lockout boundary, exact equality.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGameStatus, isRevealTime } from '../../utils/timeUtils';
import { makeGame, NOW } from '../../test-utils/factories';

describe('getGameStatus — lockout boundary', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(NOW));
  afterEach(() => vi.restoreAllMocks());

  it('returns "locked" when Date.now() EQUALS lockoutTimestampMs (>= boundary)', () => {
    const game = makeGame({ lockoutTimestampMs: NOW, revealTimestampMs: NOW + 60_000 });
    expect(getGameStatus(game)).toBe('locked');
  });

  it('returns "open" when Date.now() is 1ms BEFORE lockoutTimestampMs', () => {
    const game = makeGame({ lockoutTimestampMs: NOW + 1, revealTimestampMs: NOW + 60_001 });
    expect(getGameStatus(game)).toBe('open');
  });

  it('returns "locked" when Date.now() is 1ms AFTER lockoutTimestampMs', () => {
    const game = makeGame({ lockoutTimestampMs: NOW - 1, revealTimestampMs: NOW + 60_000 });
    expect(getGameStatus(game)).toBe('locked');
  });
});

describe('isRevealTime — exact boundary', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(NOW));
  afterEach(() => vi.restoreAllMocks());

  it('returns true when Date.now() EQUALS revealTimestampMs', () => {
    const game = makeGame({ revealTimestampMs: NOW });
    expect(isRevealTime(game)).toBe(true);
  });

  it('returns false when Date.now() is 1ms before revealTimestampMs', () => {
    const game = makeGame({ revealTimestampMs: NOW + 1 });
    expect(isRevealTime(game)).toBe(false);
  });
});

describe('msToCountdown — boundary values', () => {
  it('handles exactly 0ms', async () => {
    const { msToCountdown } = await import('../../utils/timeUtils');
    expect(msToCountdown(0)).toBe('00:00:00:00');
  });

  it('handles exactly 1ms (rounds down to 0 seconds)', async () => {
    const { msToCountdown } = await import('../../utils/timeUtils');
    expect(msToCountdown(1)).toBe('00:00:00:00');
  });

  it('handles exactly 999ms (< 1 second)', async () => {
    const { msToCountdown } = await import('../../utils/timeUtils');
    expect(msToCountdown(999)).toBe('00:00:00:00');
  });

  it('handles exactly 1000ms (1 second)', async () => {
    const { msToCountdown } = await import('../../utils/timeUtils');
    expect(msToCountdown(1000)).toBe('00:00:00:01');
  });
});
