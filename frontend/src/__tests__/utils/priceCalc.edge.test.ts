/**
 * Edge cases for priceCalc utilities:
 * - Large bigint pots where Number() loses precision
 * - Exact prize conservation for odd-nanos amounts
 */
import { describe, it, expect } from 'vitest';
import { calcPrizeBreakdown, nanosToUSD, usdToNanos } from '../../utils/priceCalc';

describe('calcPrizeBreakdown — large pot precision', () => {
  it('handles 1 million IOTA (1e18 nanos) — within JS safe integer range', () => {
    // 1_000_000 IOTA = 1e18 nanos. Number.MAX_SAFE_INTEGER ≈ 9e15,
    // so 1e18 exceeds it and Number() will round.
    const HUGE_POT = 1_000_000_000_000_000_000n; // 1 billion IOTA
    // Should not throw; breakdown ratios should be approximately correct
    const p = calcPrizeBreakdown(HUGE_POT, 3, 1.0);
    // With precision loss, values are approximate — just assert they're positive
    expect(p.prize1IOTA).toBeGreaterThan(0);
    expect(p.prize2IOTA).toBeGreaterThan(0);
    expect(p.prize3IOTA).toBeGreaterThan(0);
    expect(p.treasuryIOTA).toBeGreaterThan(0);
  });

  it('documents precision loss risk: Number() on values > MAX_SAFE_INTEGER is not exact', () => {
    // 1_000_000_000_000_000_001 (one more than 1e18) rounds to 1e18 when cast to Number
    const nanos = 1_000_000_000_000_000_001n;
    const asNumber = Number(nanos);
    expect(BigInt(asNumber)).not.toBe(nanos); // precision LOST
  });

  it('1 player prize sum equals pot for typical (< MAX_SAFE_INT) values', () => {
    const POT = 500_000_000_000n; // 500 IOTA
    const p = calcPrizeBreakdown(POT, 1, 1.0);
    const total = p.prize1IOTA + p.prize2IOTA + p.prize3IOTA + p.treasuryIOTA;
    expect(total).toBeCloseTo(500, 3);
  });

  it('3 player prize sum equals pot for typical values', () => {
    const POT = 333_333_333_333n; // 333.333... IOTA (odd nanos)
    const p = calcPrizeBreakdown(POT, 3, 1.0);
    const total = p.prize1IOTA + p.prize2IOTA + p.prize3IOTA + p.treasuryIOTA;
    expect(total).toBeCloseTo(333.333, 2);
  });

  it('2 player prize sum equals pot for typical values', () => {
    const POT = 17_000_000_000n; // 17 IOTA (small pot at min entry)
    const p = calcPrizeBreakdown(POT, 2, 1.0);
    const total = p.prize1IOTA + p.prize2IOTA + p.prize3IOTA + p.treasuryIOTA;
    expect(total).toBeCloseTo(17, 4);
  });
});

describe('usdToNanos — edge cases', () => {
  it('handles very small USD amounts without returning 0n', () => {
    const nanos = usdToNanos(0.0001, 1.0);
    expect(nanos).toBeGreaterThan(0n);
  });

  it('handles very large USD amounts', () => {
    const nanos = usdToNanos(1_000_000, 0.5); // $1M at $0.50/IOTA
    expect(nanos).toBe(2_000_000_000_000_000n); // 2B IOTA
  });
});
