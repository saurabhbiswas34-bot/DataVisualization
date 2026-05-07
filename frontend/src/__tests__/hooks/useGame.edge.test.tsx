/**
 * Edge cases for useGame / parseGameObject:
 * - revealed_at_ms "Some" (vec has a value)
 * - parseGameObject returns null on BigInt/parseInt throwing
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGame } from '../../hooks/useGame';
import { Wrapper } from '../../test-utils/wrappers';
import { GAME_OBJECT_ID, PLAYER_A, NOW, REVEAL_MS, LOCKOUT_MS } from '../../test-utils/factories';

const mockUseIotaClientQuery = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useIotaClientQuery: () => mockUseIotaClientQuery(),
}));

const REVEAL_AT = NOW - 3_600_000;

describe('useGame — revealed_at_ms Some branch', () => {
  it('parses revealedAtMs when option has a value', () => {
    mockUseIotaClientQuery.mockReturnValue({
      data: {
        data: {
          objectId: GAME_OBJECT_ID,
          content: {
            fields: {
              game_id: '1',
              pot_balance: { fields: { value: '100000000000' } },
              min_contribution_nanos: '17200000000',
              entries: { fields: { contents: [PLAYER_A] } },
              created_at_ms: String(NOW - 86_400_000),
              reveal_timestamp_ms: String(REVEAL_MS),
              lockout_timestamp_ms: String(LOCKOUT_MS),
              is_active: false,
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
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useGame(GAME_OBJECT_ID), { wrapper: Wrapper });
    expect(result.current.game!.revealedAtMs).toBe(REVEAL_AT);
    expect(result.current.game!.winner1).toBe(PLAYER_A);
    expect(result.current.game!.prize1Nanos).toBe(90_000_000_000n);
    expect(result.current.game!.isActive).toBe(false);
  });
});

describe('parseGameObject — catch block on malformed data', () => {
  it('returns null when pot_balance BigInt conversion throws', () => {
    mockUseIotaClientQuery.mockReturnValue({
      data: {
        data: {
          objectId: GAME_OBJECT_ID,
          content: {
            fields: {
              game_id: '1',
              pot_balance: { fields: { value: 'not_a_number' } }, // throws BigInt(...)
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
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useGame(GAME_OBJECT_ID), { wrapper: Wrapper });
    expect(result.current.game).toBeNull();
  });

  it('returns null when entire content structure is null', () => {
    mockUseIotaClientQuery.mockReturnValue({
      data: { data: { objectId: GAME_OBJECT_ID, content: null } },
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useGame(GAME_OBJECT_ID), { wrapper: Wrapper });
    expect(result.current.game).toBeNull();
  });
});
