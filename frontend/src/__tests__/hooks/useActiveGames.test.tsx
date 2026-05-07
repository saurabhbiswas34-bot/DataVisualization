import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useActiveGames } from '../../hooks/useActiveGames';
import { Wrapper } from '../../test-utils/wrappers';
import {
  GAME_OBJECT_ID, PLAYER_A, NOW, REVEAL_MS, LOCKOUT_MS, PACKAGE_ID,
} from '../../test-utils/factories';

const mockUseIotaClient = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useIotaClient: () => mockUseIotaClient(),
}));

vi.mock('../../networkConfig', () => ({
  useNetworkVariable: (key: string) => {
    if (key === 'packageId') return PACKAGE_ID;
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

const MOCK_EVENT = {
  parsedJson: {
    game_object_id: GAME_OBJECT_ID,
    game_id: 1,
    reveal_timestamp_ms: REVEAL_MS,
    lockout_timestamp_ms: LOCKOUT_MS,
    min_contribution_nanos: '17200000000',
    created_at_ms: String(NOW - 86_400_000),
  },
};

const MOCK_GAME_FIELDS = {
  game_id: '1',
  pot_balance: { fields: { value: '0' } },
  min_contribution_nanos: '17200000000',
  entries: { fields: { contents: [PLAYER_A] } },
  created_at_ms: String(NOW - 86_400_000),
  reveal_timestamp_ms: String(REVEAL_MS),
  lockout_timestamp_ms: String(LOCKOUT_MS),
  is_active: true,
  revealed_at_ms: { fields: { vec: [] } },
  winner_1: { fields: { vec: [] } },
  winner_2: { fields: { vec: [] } },
  winner_3: { fields: { vec: [] } },
  prize_1_nanos: '0',
  prize_2_nanos: '0',
  prize_3_nanos: '0',
  treasury_cut_nanos: '0',
};

const MOCK_GAME_OBJ = {
  data: {
    objectId: GAME_OBJECT_ID,
    content: { fields: MOCK_GAME_FIELDS },
  },
};

async function flushPromises() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 50));
  });
}

describe('useActiveGames', () => {
  it('returns empty arrays when events have no game_object_id', async () => {
    mockUseIotaClient.mockReturnValue({
      queryEvents: vi.fn().mockResolvedValue({ data: [{ parsedJson: { game_id: 1 } }] }),
      getObject: vi.fn(),
    });
    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(() => !result.current.isLoading, { timeout: 5000 });
    expect(result.current.activeGames).toEqual([]);
  });

  it('fetches and parses games when events have game_object_id', async () => {
    mockUseIotaClient.mockReturnValue({
      queryEvents: vi.fn().mockResolvedValue({ data: [MOCK_EVENT] }),
      getObject: vi.fn().mockResolvedValue(MOCK_GAME_OBJ),
    });
    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(
      () => { expect(result.current.allGames).toHaveLength(1); },
      { timeout: 5000 }
    );
    expect(result.current.allGames[0].objectId).toBe(GAME_OBJECT_ID);
  });

  it('separates active from all games', async () => {
    mockUseIotaClient.mockReturnValue({
      queryEvents: vi.fn().mockResolvedValue({ data: [MOCK_EVENT] }),
      getObject: vi.fn().mockResolvedValue(MOCK_GAME_OBJ),
    });
    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(
      () => { expect(result.current.allGames).toHaveLength(1); },
      { timeout: 5000 }
    );
    expect(result.current.activeGames).toHaveLength(1);
  });

  it('returns empty activeGames when game is inactive', async () => {
    const inactiveObj = {
      data: {
        objectId: GAME_OBJECT_ID,
        content: { fields: { ...MOCK_GAME_FIELDS, is_active: false } },
      },
    };
    mockUseIotaClient.mockReturnValue({
      queryEvents: vi.fn().mockResolvedValue({ data: [MOCK_EVENT] }),
      getObject: vi.fn().mockResolvedValue(inactiveObj),
    });
    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(
      () => { expect(result.current.allGames).toHaveLength(1); },
      { timeout: 5000 }
    );
    expect(result.current.activeGames).toHaveLength(0);
  });

  it('handles client errors gracefully (returns empty)', async () => {
    mockUseIotaClient.mockReturnValue({
      queryEvents: vi.fn().mockRejectedValue(new Error('network error')),
      getObject: vi.fn(),
    });
    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(() => !result.current.isLoading, { timeout: 5000 });
    expect(result.current.activeGames).toEqual([]);
  });

  it('skips malformed game objects', async () => {
    mockUseIotaClient.mockReturnValue({
      queryEvents: vi.fn().mockResolvedValue({ data: [MOCK_EVENT] }),
      getObject: vi.fn().mockResolvedValue({ data: { content: null } }),
    });
    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(() => !result.current.isLoading, { timeout: 5000 });
    expect(result.current.allGames).toEqual([]);
  });

  it('sorts games by revealTimestampMs ascending', async () => {
    const event2 = {
      parsedJson: { game_object_id: '0x' + '1'.repeat(64), game_id: 2 },
    };
    const obj2 = {
      data: {
        objectId: '0x' + '1'.repeat(64),
        content: { fields: { ...MOCK_GAME_FIELDS, game_id: '2', reveal_timestamp_ms: String(REVEAL_MS + 86_400_000) } },
      },
    };
    mockUseIotaClient.mockReturnValue({
      queryEvents: vi.fn().mockResolvedValue({ data: [event2, MOCK_EVENT] }),
      getObject: vi.fn()
        .mockResolvedValueOnce(obj2)
        .mockResolvedValueOnce(MOCK_GAME_OBJ),
    });
    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(
      () => { expect(result.current.allGames).toHaveLength(2); },
      { timeout: 5000 }
    );
    expect(result.current.allGames[0].revealTimestampMs).toBeLessThan(
      result.current.allGames[1].revealTimestampMs
    );
  });
});
