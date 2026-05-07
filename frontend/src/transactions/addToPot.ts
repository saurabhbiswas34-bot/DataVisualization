import { Transaction } from '@iota/iota-sdk/transactions';
import { CLOCK_OBJECT_ID } from '../networkConfig';

export function buildAddToPotTx(
  packageId: string,
  gameObjectId: string,
  amountNanos: bigint,
  userEntropy?: string
): Transaction {
  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountNanos)]);

  let entropyBytes: number[] = [];
  if (userEntropy && userEntropy.trim()) {
    entropyBytes = Array.from(new TextEncoder().encode(userEntropy.trim()));
  }

  tx.moveCall({
    target: `${packageId}::matka_pot::add_to_pot`,
    arguments: [
      tx.object(gameObjectId),
      coin,
      tx.pure.vector('u8', entropyBytes),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}
