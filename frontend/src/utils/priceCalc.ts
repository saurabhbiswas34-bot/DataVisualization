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
  const total = Number(totalNanos);
  let p1 = 0, p2 = 0, p3 = 0, treasury = 0;
  if (uniquePlayers <= 1) {
    p1 = Math.floor(total * 0.9);
    treasury = total - p1;
  } else if (uniquePlayers === 2) {
    p1 = Math.floor(total * 0.5);
    p2 = Math.floor(total * 0.4);
    treasury = total - p1 - p2;
  } else {
    p1 = Math.floor(total * 0.5);
    p2 = Math.floor(total * 0.3);
    p3 = Math.floor(total * 0.1);
    treasury = total - p1 - p2 - p3;
  }
  const toIOTA = (n: number) => n / 1e9;
  const toUSD = (n: number) => toIOTA(n) * priceUSD;
  return {
    prize1IOTA: toIOTA(p1), prize1USD: toUSD(p1),
    prize2IOTA: toIOTA(p2), prize2USD: toUSD(p2),
    prize3IOTA: toIOTA(p3), prize3USD: toUSD(p3),
    treasuryIOTA: toIOTA(treasury), treasuryUSD: toUSD(treasury),
  };
}
