import { describe, it, expect } from 'vitest';
import { nanosToIOTA, iotaToNanos, formatIOTA, formatIOTACompact } from '../../utils/formatIOTA';

describe('nanosToIOTA', () => {
  it('converts 1 IOTA (1e9 nanos) to 1.0', () => {
    expect(nanosToIOTA(1_000_000_000n)).toBe(1);
  });

  it('converts 0 nanos to 0', () => {
    expect(nanosToIOTA(0n)).toBe(0);
  });

  it('accepts bigint, number, and string inputs', () => {
    expect(nanosToIOTA(1_000_000_000n)).toBe(1);
    expect(nanosToIOTA(1_000_000_000)).toBe(1);
    expect(nanosToIOTA('1000000000')).toBe(1);
  });

  it('handles fractional IOTA (500 MILLI = 0.5)', () => {
    expect(nanosToIOTA(500_000_000n)).toBeCloseTo(0.5);
  });

  it('handles large values correctly', () => {
    expect(nanosToIOTA(100_000_000_000n)).toBe(100);
  });
});

describe('iotaToNanos', () => {
  it('converts 1 IOTA to 1e9 nanos', () => {
    expect(iotaToNanos(1)).toBe(1_000_000_000n);
  });

  it('converts 0 to 0n', () => {
    expect(iotaToNanos(0)).toBe(0n);
  });

  it('rounds up fractional nanos', () => {
    // 1.0000000001 IOTA should ceil to 1000000001 nanos
    const result = iotaToNanos(1.0000000001);
    expect(result).toBeGreaterThanOrEqual(1_000_000_000n);
  });

  it('converts 17.2 IOTA correctly', () => {
    expect(iotaToNanos(17.2)).toBe(17_200_000_000n);
  });

  it('round-trips nanosToIOTA → iotaToNanos', () => {
    const original = 50_000_000_000n;
    const iota = nanosToIOTA(original);
    const back = iotaToNanos(iota);
    expect(back).toBe(original);
  });
});

describe('formatIOTA', () => {
  it('formats with default 4 decimals', () => {
    expect(formatIOTA(1_000_000_000n)).toBe('1.0000');
  });

  it('formats with custom decimals', () => {
    expect(formatIOTA(1_000_000_000n, 2)).toBe('1.00');
  });

  it('formats 0 as 0.0000', () => {
    expect(formatIOTA(0n)).toBe('0.0000');
  });

  it('formats 100 IOTA', () => {
    expect(formatIOTA(100_000_000_000n, 2)).toBe('100.00');
  });
});

describe('formatIOTACompact', () => {
  it('formats values >= 1000 with K suffix', () => {
    // 1000 IOTA → 1000/1000 = 1.00K
    expect(formatIOTACompact(1_000_000_000_000n)).toBe('1.00K');
  });

  it('formats values >= 1 with 2 decimals', () => {
    expect(formatIOTACompact(5_500_000_000n)).toBe('5.50');
  });

  it('formats values < 1 with 4 decimals', () => {
    expect(formatIOTACompact(100_000_000n)).toBe('0.1000');
  });

  it('formats 2500 IOTA as 2.50K', () => {
    expect(formatIOTACompact(2_500_000_000_000n)).toBe('2.50K');
  });
});
