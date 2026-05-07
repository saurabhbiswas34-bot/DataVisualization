import { Transaction } from '@iota/iota-sdk/transactions';
import { CLOCK_OBJECT_ID } from '../networkConfig';

export function buildCreateGameTx(
  packageId: string,
  adminCapId: string,
  globalConfigId: string,
  revealTimestampMs: number
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::matka_pot::create_game`,
    arguments: [
      tx.object(adminCapId),
      tx.object(globalConfigId),
      tx.object(CLOCK_OBJECT_ID),
      tx.pure.u64(BigInt(revealTimestampMs)),
    ],
  });
  return tx;
}
