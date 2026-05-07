/**
 * Edge-case tests for useActiveGames:
 * - Empty/0xTODO packageId early return
 * - revealed_at_ms "Some" path (option with a value)
 * - Inner try/catch for malformed individual game object
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActiveGames } from '../../hooks/useActiveGames';
import { Wrapper } from '../../test-utils/wrappers';
import { GAME_OBJECT_ID, PLAYER_A, NOW, REVEAL_MS, LOCKOUT_MS } from '../../test-utils/factories';

const mockUseIotaClient = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useIotaClient: () => mockUseIotaClient(),
}));

const mockUseNetworkVariable = vi.fn();

vi.mock('../../networkConfig', () => ({
  useNetworkVariable: (key: string) => mockUseNetworkVariable(key),
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

describe('useActiveGames — packageId edge cases', () => {
  it('returns empty immediately when packageId is "0xTODO"', async () => {
    mockUseNetworkVariable.mockReturnValue('0xTODO');
    mockUseIotaClient.mockReturnValue({ queryEvents: vi.fn(), getObject: vi.fn() });

    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(() => !result.current.isLoading, { timeout: 3000 });

    expect(result.current.allGames).toEqual([]);
  });

  it('returns empty immediately when packageId is empty string', async () => {
    mockUseNetworkVariable.mockReturnValue('');
    mockUseIotaClient.mockReturnValue({ queryEvents: vi.fn(), getObject: vi.fn() });

    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(() => !result.current.isLoading, { timeout: 3000 });

    expect(result.current.allGames).toEqual([]);
  });
});

describe('useActiveGames — revealed_at_ms "Some" branch', () => {
  it('parses revealedAtMs when revealed_at_ms option has a value', async () => {
    const REVEAL_AT = NOW - 3_600_000; // revealed 1h ago
    const revealedObj = {
      data: {
        objectId: GAME_OBJECT_ID,
        content: {
          fields: {
            game_id: '1',
            pot_balance: { fields: { value: '0' } },
            min_contribution_nanos: '17200000000',
            entries: { fields: { contents: [PLAYER_A] } },
            created_at_ms: String(NOW - 86_400_000),
            reveal_timestamp_ms: String(REVEAL_MS),
            lockout_timestamp_ms: String(LOCKOUT_MS),
            is_active: false,
            // "Some" variant: vec has one element
            revealed_at_ms: { fields: { vec: [String(REVEAL_AT)] } },
            winner_1: { fields: { vec: [PLAYER_A] } },
            winner_2: { fields: { vec: [] } },
            winner_3: { fields: { vec: [] } },
            prize_1_nanos: '90000000000',
            prize_2_nanos: '0',
            prize_3_nanos: '0',
            treasury_cut_nanos: '10000000000',
          },
        },
      },
    };

    mockUseNetworkVariable.mockReturnValue('0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a');
    mockUseIotaClient.mockReturnValue({
      queryEvents: vi.fn().mockResolvedValue({ data: [MOCK_EVENT] }),
      getObject: vi.fn().mockResolvedValue(revealedObj),
    });

    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(
      () => { expect(result.current.allGames).toHaveLength(1); },
      { timeout: 5000 }
    );

    const game = result.current.allGames[0];
    expect(game.revealedAtMs).toBe(REVEAL_AT);
    expect(game.winner1).toBe(PLAYER_A);
    expect(game.prize1Nanos).toBe(90_000_000_000n);
  });
});

describe('useActiveGames — inner per-object catch', () => {
  it('skips objects where inner BigInt conversion throws', async () => {
    const badObj = {
      data: {
        objectId: GAME_OBJECT_ID,
        content: {
          fields: {
            game_id: '1',
            pot_balance: { fields: { value: 'NOT_A_NUMBER' } }, // will throw on BigInt()
            min_contribution_nanos: '17200000000',
            entries: { fields: { contents: [] } },
            created_at_ms: String(NOW),
            reveal_timestamp_ms: String(REVEAL_MS),
            lockout_timestamp_ms: String(LOCKOUT_MS),
            is_active: true,
            revealed_at_ms: { fields: { vec: [] } },
            winner_1: { fields: { vec: [] } },
            winner_2: { fields: { vec: [] } },
            winner_3: { fields: { vec: [] } },
            prize_1_nanos: 'bad',
            prize_2_nanos: '0',
            prize_3_nanos: '0',
            treasury_cut_nanos: '0',
          },
        },
      },
    };

    mockUseNetworkVariable.mockReturnValue('0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a');
    mockUseIotaClient.mockReturnValue({
      queryEvents: vi.fn().mockResolvedValue({ data: [MOCK_EVENT] }),
      getObject: vi.fn().mockResolvedValue(badObj),
    });

    const { result } = renderHook(() => useActiveGames(), { wrapper: Wrapper });
    await waitFor(() => !result.current.isLoading, { timeout: 5000 });

    // Malformed object should be silently skipped
    expect(result.current.allGames).toHaveLength(0);
  });
});
