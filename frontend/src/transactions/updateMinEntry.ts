import { Transaction } from '@iota/iota-sdk/transactions';

export function buildUpdateMinEntryTx(
  packageId: string,
  adminCapId: string,
  globalConfigId: string,
  newMinNanos: bigint
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::matka_pot::update_min_contribution`,
    arguments: [
      tx.object(adminCapId),
      tx.object(globalConfigId),
      tx.pure.u64(newMinNanos),
    ],
  });
  return tx;
}
