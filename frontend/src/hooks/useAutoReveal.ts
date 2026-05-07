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

  // Pin the latest signAndExecute and callbacks in refs so the setInterval
  // closure always calls the current version without being in the deps array
  // (adding them would reset the interval on every render / wallet reconnect).
  const signAndExecuteRef = useRef(signAndExecute);
  const onRevealStartRef  = useRef(onRevealStart);
  const onRevealSuccessRef = useRef(onRevealSuccess);
  const onRevealErrorRef  = useRef(onRevealError);
  useEffect(() => { signAndExecuteRef.current   = signAndExecute; });
  useEffect(() => { onRevealStartRef.current     = onRevealStart; });
  useEffect(() => { onRevealSuccessRef.current   = onRevealSuccess; });
  useEffect(() => { onRevealErrorRef.current     = onRevealError; });

  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(() => {
      const now = Date.now();
      for (const game of games) {
        if (!game.isActive) continue;
        if (now < game.revealTimestampMs) continue;
        if (revealingRef.current.has(game.objectId)) continue;
        revealingRef.current.add(game.objectId);
        onRevealStartRef.current?.(game.gameId);
        const tx = buildRevealWinnersTx(packageId, game.objectId, globalConfigId);
        signAndExecuteRef.current(
          { transaction: tx },
          {
            onSuccess: () => {
              revealingRef.current.delete(game.objectId);
              onRevealSuccessRef.current?.(game.gameId);
            },
            onError: (err) => {
              revealingRef.current.delete(game.objectId);
              onRevealErrorRef.current?.(game.gameId, err.message);
            },
          }
        );
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [games, isAdmin, packageId, globalConfigId]);
}
