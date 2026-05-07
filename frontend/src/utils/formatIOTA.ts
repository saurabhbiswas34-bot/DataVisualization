const NANOS_PER_IOTA = 1_000_000_000n;

export function nanosToIOTA(nanos: bigint | string | number): number {
  const n = BigInt(nanos.toString());
  return Number(n) / Number(NANOS_PER_IOTA);
}

export function iotaToNanos(iota: number): bigint {
  // Avoid float × 1e9 rounding errors (e.g. 1.1 * 1e9 = 1099999999.9999998).
  // toFixed(9) produces an exact 9-decimal string which we split into whole
  // nanos without any floating-point intermediate.
  const [whole, frac = ''] = iota.toFixed(9).split('.');
  return BigInt(whole) * NANOS_PER_IOTA + BigInt(frac.padEnd(9, '0').slice(0, 9));
}

export function formatIOTA(nanos: bigint | string | number, decimals = 4): string {
  return nanosToIOTA(nanos).toFixed(decimals);
}

export function formatIOTACompact(nanos: bigint | string | number): string {
  const iota = nanosToIOTA(nanos);
  if (iota >= 1000) return `${(iota / 1000).toFixed(2)}K`;
  if (iota >= 1) return iota.toFixed(2);
  return iota.toFixed(4);
}
