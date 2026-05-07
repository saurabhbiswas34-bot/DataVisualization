import { useEffect, useRef } from 'react';
import { useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { buildRevealWinnersTx } from '../transactions/revealWinners';
import { useNetworkVariable } from '../networkConfig';
import type { ParsedGame } from '../types';

export function useAutoReveal(
  games: ParsedGame[],
  isAdmin: boolean,
  onRevealStart?: (gameId: number) => void,
  onRevealSuccess?: (gameId: number) => void,
  onRevealError?: (gameId: number, err: string) => void
) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable('packageId');
  const globalConfigId = useNetworkVariable('globalConfigId');
  const revealingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(() => {
      const now = Date.now();
      for (const game of games) {
        if (!game.isActive) continue;
        if (now < game.revealTimestampMs) continue;
        if (revealingRef.current.has(game.objectId)) continue;
        revealingRef.current.add(game.objectId);
        onRevealStart?.(game.gameId);
        const tx = buildRevealWinnersTx(packageId, game.objectId, globalConfigId);
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: () => {
              revealingRef.current.delete(game.objectId);
              onRevealSuccess?.(game.gameId);
            },
            onError: (err) => {
              revealingRef.current.delete(game.objectId);
              onRevealError?.(game.gameId, err.message);
            },
          }
        );
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [games, isAdmin, packageId, globalConfigId]);
}
