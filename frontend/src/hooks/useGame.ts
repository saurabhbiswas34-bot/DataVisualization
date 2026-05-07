import { useIotaClientQuery } from '@iota/dapp-kit';
import type { ParsedGame } from '../types';

function parseGameObject(obj: unknown): ParsedGame | null {
  try {
    const f = (obj as any)?.data?.content?.fields;
    if (!f) return null;
    const optVal = (opt: unknown) => (opt as any)?.fields?.vec?.[0] ?? null;
    return {
      objectId: (obj as any).data.objectId,
      gameId: parseInt(f.game_id),
      potNanos: BigInt(f.pot_balance?.fields?.value ?? f.pot_balance ?? '0'),
      potIOTA:
        Number(BigInt(f.pot_balance?.fields?.value ?? f.pot_balance ?? '0')) / 1e9,
      minContributionNanos: BigInt(f.min_contribution_nanos),
      players: f.entries?.fields?.contents ?? [],
      createdAtMs: parseInt(f.created_at_ms),
      revealTimestampMs: parseInt(f.reveal_timestamp_ms),
      lockoutTimestampMs: parseInt(f.lockout_timestamp_ms),
      isActive: f.is_active,
      revealedAtMs: optVal(f.revealed_at_ms)
        ? parseInt(optVal(f.revealed_at_ms))
        : null,
      winner1: optVal(f.winner_1),
      winner2: optVal(f.winner_2),
      winner3: optVal(f.winner_3),
      prize1Nanos: BigInt(f.prize_1_nanos ?? '0'),
      prize2Nanos: BigInt(f.prize_2_nanos ?? '0'),
      prize3Nanos: BigInt(f.prize_3_nanos ?? '0'),
      treasuryCutNanos: BigInt(f.treasury_cut_nanos ?? '0'),
    };
  } catch {
    return null;
  }
}

export function useGame(objectId: string) {
  const { data, isLoading, error, refetch } = useIotaClientQuery(
    'getObject',
    { id: objectId, options: { showContent: true } },
    { refetchInterval: 10_000, enabled: !!objectId }
  );
  return {
    game: data ? parseGameObject(data) : null,
    isLoading,
    error,
    refetch,
    parseGameObject,
  };
}
