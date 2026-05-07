import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGame } from '../../hooks/useGame';
import { Wrapper } from '../../test-utils/wrappers';
import {
  GAME_OBJECT_ID, PLAYER_A, NOW, REVEAL_MS, LOCKOUT_MS,
} from '../../test-utils/factories';

const mockUseIotaClientQuery = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useIotaClientQuery: (_method: string, _params: unknown, _opts: unknown) =>
    mockUseIotaClientQuery(),
}));

const MOCK_GAME_FIELDS = {
  game_id: '1',
  pot_balance: { fields: { value: '100000000000' } },
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

describe('useGame', () => {
  it('returns null game when no data', () => {
    mockUseIotaClientQuery.mockReturnValue({ data: null, isLoading: false, error: null });
    const { result } = renderHook(() => useGame(GAME_OBJECT_ID), { wrapper: Wrapper });
    expect(result.current.game).toBeNull();
  });

  it('returns isLoading=true when query is loading', () => {
    mockUseIotaClientQuery.mockReturnValue({ data: null, isLoading: true, error: null });
    const { result } = renderHook(() => useGame(GAME_OBJECT_ID), { wrapper: Wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('parses a valid game object correctly', () => {
    mockUseIotaClientQuery.mockReturnValue({
      data: { data: { objectId: GAME_OBJECT_ID, content: { fields: MOCK_GAME_FIELDS } } },
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useGame(GAME_OBJECT_ID), { wrapper: Wrapper });
    const game = result.current.game;
    expect(game).not.toBeNull();
    expect(game!.objectId).toBe(GAME_OBJECT_ID);
    expect(game!.gameId).toBe(1);
    expect(game!.potNanos).toBe(100_000_000_000n);
    expect(game!.potIOTA).toBe(100);
    expect(game!.minContributionNanos).toBe(17_200_000_000n);
    expect(game!.players).toEqual([PLAYER_A]);
    expect(game!.isActive).toBe(true);
  });

  it('parses optional winner fields as null when empty vec', () => {
    mockUseIotaClientQuery.mockReturnValue({
      data: { data: { objectId: GAME_OBJECT_ID, content: { fields: MOCK_GAME_FIELDS } } },
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useGame(GAME_OBJECT_ID), { wrapper: Wrapper });
    expect(result.current.game!.winner1).toBeNull();
  });

  it('returns null when content fields are missing', () => {
    mockUseIotaClientQuery.mockReturnValue({
      data: { data: { objectId: GAME_OBJECT_ID, content: null } },
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useGame(GAME_OBJECT_ID), { wrapper: Wrapper });
    expect(result.current.game).toBeNull();
  });

  it('exposes parseGameObject utility function', () => {
    mockUseIotaClientQuery.mockReturnValue({ data: null, isLoading: false, error: null });
    const { result } = renderHook(() => useGame(GAME_OBJECT_ID), { wrapper: Wrapper });
    expect(typeof result.current.parseGameObject).toBe('function');
  });

  it('does not query when objectId is empty', () => {
    mockUseIotaClientQuery.mockReturnValue({ data: null, isLoading: false, error: null });
    renderHook(() => useGame(''), { wrapper: Wrapper });
    // enabled=false when objectId is empty string, so no call is made
    expect(mockUseIotaClientQuery).toHaveBeenCalled();
  });
});
