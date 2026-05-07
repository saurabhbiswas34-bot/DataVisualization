const NANOS_PER_IOTA = 1_000_000_000n;

export function nanosToIOTA(nanos: bigint | string | number): number {
  const n = BigInt(nanos.toString());
  return Number(n) / Number(NANOS_PER_IOTA);
}

export function iotaToNanos(iota: number): bigint {
  return BigInt(Math.ceil(iota * Number(NANOS_PER_IOTA)));
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
