import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoReveal } from '../../hooks/useAutoReveal';
import { Wrapper } from '../../test-utils/wrappers';
import { makeGame, PACKAGE_ID, GLOBAL_CONFIG_ID, NOW } from '../../test-utils/factories';

const mockSignAndExecute = vi.fn();
const mockMutate = vi.fn((_opts: unknown, callbacks: { onSuccess?: Function; onError?: Function }) => {
  callbacks?.onSuccess?.();
});

vi.mock('@iota/dapp-kit', () => ({
  useSignAndExecuteTransaction: () => ({ mutate: mockMutate }),
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

describe('useAutoReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not reveal when isAdmin=false', () => {
    const games = [makeGame({ revealTimestampMs: NOW - 1_000 })];
    renderHook(() => useAutoReveal(games, false), { wrapper: Wrapper });
    act(() => { vi.advanceTimersByTime(15_000); });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('does not reveal when game is not yet past reveal time', () => {
    const games = [makeGame({ revealTimestampMs: NOW + 60_000 })];
    renderHook(() => useAutoReveal(games, true), { wrapper: Wrapper });
    act(() => { vi.advanceTimersByTime(15_000); });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('does not reveal inactive games', () => {
    const games = [makeGame({ revealTimestampMs: NOW - 1_000, isActive: false })];
    renderHook(() => useAutoReveal(games, true), { wrapper: Wrapper });
    act(() => { vi.advanceTimersByTime(15_000); });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('triggers reveal when admin and reveal time has passed', () => {
    const onRevealStart = vi.fn();
    const onRevealSuccess = vi.fn();
    const games = [makeGame({ revealTimestampMs: NOW - 1_000 })];
    renderHook(
      () => useAutoReveal(games, true, onRevealStart, onRevealSuccess),
      { wrapper: Wrapper }
    );
    act(() => { vi.advanceTimersByTime(11_000); }); // interval is 10s
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(onRevealStart).toHaveBeenCalled();
  });

  it('calls onRevealError on transaction failure', () => {
    const onRevealError = vi.fn();
    mockMutate.mockImplementationOnce(
      (_opts: unknown, cbs: { onError?: Function }) => cbs?.onError?.(new Error('fail'))
    );
    const games = [makeGame({ revealTimestampMs: NOW - 1_000 })];
    renderHook(
      () => useAutoReveal(games, true, undefined, undefined, onRevealError),
      { wrapper: Wrapper }
    );
    act(() => { vi.advanceTimersByTime(11_000); });
    expect(onRevealError).toHaveBeenCalled();
  });

  it('does not double-reveal the same game', () => {
    // Uses a mock that never resolves to keep the game "revealing"
    mockMutate.mockImplementation(() => {}); // never calls callbacks
    const games = [makeGame({ revealTimestampMs: NOW - 1_000 })];
    renderHook(() => useAutoReveal(games, true), { wrapper: Wrapper });
    act(() => { vi.advanceTimersByTime(11_000); });
    act(() => { vi.advanceTimersByTime(11_000); }); // second interval
    expect(mockMutate).toHaveBeenCalledTimes(1); // only once
  });
});
