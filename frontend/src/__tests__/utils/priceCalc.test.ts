import { describe, it, expect } from 'vitest';
import { nanosToUSD, usdToNanos, calcPrizeBreakdown } from '../../utils/priceCalc';

describe('nanosToUSD', () => {
  it('converts 1 IOTA at $1 price to $1 USD', () => {
    expect(nanosToUSD(1_000_000_000n, 1)).toBeCloseTo(1);
  });

  it('converts 100 IOTA at $0.30 price', () => {
    expect(nanosToUSD(100_000_000_000n, 0.30)).toBeCloseTo(30);
  });

  it('returns 0 for 0 nanos', () => {
    expect(nanosToUSD(0n, 1)).toBe(0);
  });

  it('accepts number and string nanos', () => {
    expect(nanosToUSD(1_000_000_000, 1)).toBeCloseTo(1);
    expect(nanosToUSD('1000000000', 1)).toBeCloseTo(1);
  });
});

describe('usdToNanos', () => {
  it('returns 0n when price is 0 or negative', () => {
    expect(usdToNanos(1, 0)).toBe(0n);
    expect(usdToNanos(1, -1)).toBe(0n);
  });

  it('converts $1 at $1/IOTA to 1e9 nanos', () => {
    expect(usdToNanos(1, 1)).toBe(1_000_000_000n);
  });

  it('converts $1 at $0.30/IOTA to ~3.33 IOTA in nanos', () => {
    const nanos = usdToNanos(1, 0.30);
    expect(Number(nanos)).toBeGreaterThanOrEqual(3_333_333_333);
    expect(Number(nanos)).toBeLessThanOrEqual(3_333_333_334);
  });

  it('rounds up fractional nanos', () => {
    // Any non-zero amount should ceil
    const nanos = usdToNanos(0.001, 1);
    expect(nanos).toBeGreaterThan(0n);
  });
});

describe('calcPrizeBreakdown', () => {
  const POT_100 = 100_000_000_000n; // 100 IOTA
  const PRICE = 1.0;

  describe('1 player: 90/0/0/10 split', () => {
    it('gives 90 IOTA to winner and 10 to treasury', () => {
      const p = calcPrizeBreakdown(POT_100, 1, PRICE);
      expect(p.prize1IOTA).toBeCloseTo(90);
      expect(p.prize2IOTA).toBe(0);
      expect(p.prize3IOTA).toBe(0);
      expect(p.treasuryIOTA).toBeCloseTo(10);
    });

    it('applies same split for 0 players', () => {
      const p = calcPrizeBreakdown(POT_100, 0, PRICE);
      expect(p.prize1IOTA).toBeCloseTo(90);
    });
  });

  describe('2 players: 50/40/0/10 split', () => {
    it('splits 50/40 between winners', () => {
      const p = calcPrizeBreakdown(POT_100, 2, PRICE);
      expect(p.prize1IOTA).toBeCloseTo(50);
      expect(p.prize2IOTA).toBeCloseTo(40);
      expect(p.prize3IOTA).toBe(0);
      expect(p.treasuryIOTA).toBeCloseTo(10);
    });
  });

  describe('3+ players: 50/30/10/10 split', () => {
    it('splits 50/30/10/10 with 3 players', () => {
      const p = calcPrizeBreakdown(POT_100, 3, PRICE);
      expect(p.prize1IOTA).toBeCloseTo(50);
      expect(p.prize2IOTA).toBeCloseTo(30);
      expect(p.prize3IOTA).toBeCloseTo(10);
      expect(p.treasuryIOTA).toBeCloseTo(10);
    });

    it('same split with 10 players', () => {
      const p = calcPrizeBreakdown(POT_100, 10, PRICE);
      expect(p.prize1IOTA).toBeCloseTo(50);
      expect(p.prize2IOTA).toBeCloseTo(30);
    });
  });

  it('converts USD values using priceUSD', () => {
    const p = calcPrizeBreakdown(POT_100, 1, 2.0);
    expect(p.prize1USD).toBeCloseTo(180); // 90 IOTA × $2
    expect(p.treasuryUSD).toBeCloseTo(20);
  });

  it('handles 0 pot without crashing', () => {
    const p = calcPrizeBreakdown(0n, 3, 1);
    expect(p.prize1IOTA).toBe(0);
    expect(p.prize2IOTA).toBe(0);
    expect(p.prize3IOTA).toBe(0);
    expect(p.treasuryIOTA).toBe(0);
  });

  it('prize total equals pot (conservation)', () => {
    const p = calcPrizeBreakdown(POT_100, 3, 1);
    const total = p.prize1IOTA + p.prize2IOTA + p.prize3IOTA + p.treasuryIOTA;
    expect(total).toBeCloseTo(100);
  });
});
