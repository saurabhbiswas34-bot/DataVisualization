/**
 * useAutoReveal — interval cleanup on unmount.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoReveal } from '../../hooks/useAutoReveal';
import { Wrapper } from '../../test-utils/wrappers';
import { makeGame, PACKAGE_ID, GLOBAL_CONFIG_ID, NOW } from '../../test-utils/factories';

vi.mock('@iota/dapp-kit', () => ({
  useSignAndExecuteTransaction: () => ({ mutate: vi.fn() }),
}));

vi.mock('../../networkConfig', () => ({
  useNetworkVariable: (key: string) => {
    if (key === 'packageId') return PACKAGE_ID;
    if (key === 'globalConfigId') return GLOBAL_CONFIG_ID;
    return '';
  },
  RANDOM_OBJECT_ID: '0x8',
  CLOCK_OBJECT_ID: '0x6',
  MIN_GAME_DURATION_MS: 86_400_000,
  LOCKOUT_DURATION_MS: 600_000,
  HISTORY_THRESHOLD_MS: 259_200_000,
  PRIZE_PCTS: {},
  ACTIVE_NETWORK: 'testnet',
}));

vi.mock('../../transactions/revealWinners', () => ({
  buildRevealWinnersTx: vi.fn(() => ({ serialize: vi.fn() })),
}));

describe('useAutoReveal — interval cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls clearInterval when hook unmounts', () => {
    const clearSpy = vi.spyOn(global, 'clearInterval');
    const games = [makeGame({ revealTimestampMs: NOW + 3_600_000 })];
    const { unmount } = renderHook(
      () => useAutoReveal(games, true),
      { wrapper: Wrapper }
    );
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('resets interval when games array changes', () => {
    const clearSpy = vi.spyOn(global, 'clearInterval');
    const games1 = [makeGame({ revealTimestampMs: NOW + 3_600_000 })];
    const games2 = [makeGame({ revealTimestampMs: NOW + 7_200_000 })];
    const { rerender } = renderHook(
      ({ games }: { games: typeof games1 }) => useAutoReveal(games, true),
      { wrapper: Wrapper, initialProps: { games: games1 } }
    );
    rerender({ games: games2 });
    // clearInterval called when deps change (cleanup of previous effect)
    expect(clearSpy).toHaveBeenCalled();
  });
});
