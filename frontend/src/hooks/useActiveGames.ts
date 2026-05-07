import { useIotaClient } from '@iota/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { useNetworkVariable } from '../networkConfig';
import type { ParsedGame } from '../types';

export function useActiveGames() {
  const client = useIotaClient();
  const packageId = useNetworkVariable('packageId');

  const { data: games, isLoading, error, refetch } = useQuery({
    queryKey: ['active-games', packageId],
    queryFn: async (): Promise<ParsedGame[]> => {
      if (!packageId || packageId === '0xTODO') return [];
      try {
        // Paginate through ALL GameCreated events — a hard limit of 50 silently
        // drops older games from every page, history, and treasury rollup.
        const allEvents: any[] = [];
        let cursor: any = undefined;
        do {
          const page: any = await client.queryEvents({
            query: { MoveEventType: `${packageId}::events::GameCreated` },
            limit: 50,
            cursor,
          });
          allEvents.push(...page.data);
          cursor = page.hasNextPage ? page.nextCursor : null;
        } while (cursor);

        const objectIds = allEvents
          .map((e: any) => e.parsedJson?.game_object_id)
          .filter(Boolean);

        if (objectIds.length === 0) return [];

        const objects = await Promise.all(
          objectIds.map((id: string) =>
            client.getObject({ id, options: { showContent: true } })
          )
        );

        const parsed: ParsedGame[] = [];
        for (const obj of objects) {
          const f = (obj as any)?.data?.content?.fields;
          if (!f) continue;
          const optVal = (opt: unknown): string | null => {
            if (opt === null || opt === undefined) return null;
            if (typeof opt === 'string') return opt;
            return (opt as any)?.fields?.vec?.[0] ?? null;
          };
          try {
            parsed.push({
              objectId: (obj as any).data.objectId,
              gameId: parseInt(f.game_id),
              potNanos: BigInt(f.pot_balance?.fields?.value ?? f.pot_balance ?? '0'),
              potIOTA:
                Number(
                  BigInt(f.pot_balance?.fields?.value ?? f.pot_balance ?? '0')
                ) / 1e9,
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
            });
          } catch {
            // skip malformed
          }
        }
        return parsed.sort((a, b) => a.revealTimestampMs - b.revealTimestampMs);
      } catch {
        return [];
      }
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const activeGames = (games ?? []).filter((g) => g.isActive);
  const allGames = games ?? [];

  return { activeGames, allGames, isLoading, error, refetch };
}
