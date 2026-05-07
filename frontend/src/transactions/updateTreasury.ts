import { Transaction } from '@iota/iota-sdk/transactions';

export function buildUpdateTreasuryTx(
  packageId: string,
  adminCapId: string,
  globalConfigId: string,
  newAddress: string
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::matka_pot::update_treasury_address`,
    arguments: [
      tx.object(adminCapId),
      tx.object(globalConfigId),
      tx.pure.address(newAddress),
    ],
  });
  return tx;
}
