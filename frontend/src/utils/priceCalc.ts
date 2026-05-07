import { nanosToIOTA } from './formatIOTA';

export function nanosToUSD(nanos: bigint | string | number, priceUSD: number): number {
  return nanosToIOTA(nanos) * priceUSD;
}

export function usdToNanos(usd: number, priceUSD: number): bigint {
  if (priceUSD <= 0) return 0n;
  const iota = usd / priceUSD;
  return BigInt(Math.ceil(iota * 1_000_000_000));
}

export function calcPrizeBreakdown(
  totalNanos: bigint,
  uniquePlayers: number,
  priceUSD: number
) {
  // Keep arithmetic in bigint to mirror prize::calculate exactly and avoid
  // Number() precision loss on pots larger than Number.MAX_SAFE_INTEGER nanos.
  let p1 = 0n, p2 = 0n, p3 = 0n, treasury = 0n;
  if (uniquePlayers <= 1) {
    treasury = totalNanos / 10n;           // 10%
    p1 = totalNanos - treasury;            // 90%
  } else if (uniquePlayers === 2) {
    p1 = totalNanos / 2n;                  // 50%
    p2 = (totalNanos * 40n) / 100n;        // 40%
    treasury = totalNanos - p1 - p2;       // remainder (~10%)
  } else {
    p1 = totalNanos / 2n;                  // 50%
    p2 = (totalNanos * 30n) / 100n;        // 30%
    p3 = totalNanos / 10n;                 // 10%
    treasury = totalNanos - p1 - p2 - p3;  // remainder (~10%)
  }
  const toIOTA = (n: bigint) => Number(n) / 1e9;
  const toUSD  = (n: bigint) => toIOTA(n) * priceUSD;
  return {
    prize1IOTA: toIOTA(p1),   prize1USD: toUSD(p1),
    prize2IOTA: toIOTA(p2),   prize2USD: toUSD(p2),
    prize3IOTA: toIOTA(p3),   prize3USD: toUSD(p3),
    treasuryIOTA: toIOTA(treasury), treasuryUSD: toUSD(treasury),
  };
}
