import { Transaction } from '@iota/iota-sdk/transactions';
import { RANDOM_OBJECT_ID, CLOCK_OBJECT_ID } from '../networkConfig';

export function buildRevealWinnersTx(
  packageId: string,
  gameObjectId: string,
  globalConfigId: string
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::matka_pot::reveal_winners`,
    arguments: [
      tx.object(gameObjectId),
      tx.object(RANDOM_OBJECT_ID),
      tx.object(CLOCK_OBJECT_ID),
      tx.object(globalConfigId),
    ],
  });
  return tx;
}
