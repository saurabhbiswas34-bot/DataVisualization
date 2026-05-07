import { describe, it, expect } from 'vitest';
import { formatAddress, isValidIotaAddress } from '../../utils/formatAddress';

const FULL_ADDR = '0x' + 'a'.repeat(64);

describe('formatAddress', () => {
  it('truncates a full-length address with default 6 chars on each side', () => {
    const result = formatAddress(FULL_ADDR);
    expect(result).toBe(`0xaaaaaa...aaaaaa`);
  });

  it('returns address unchanged if it is short enough (<=14 chars)', () => {
    const short = '0xabcdef';
    expect(formatAddress(short)).toBe(short);
  });

  it('handles custom chars parameter', () => {
    const result = formatAddress(FULL_ADDR, 4);
    expect(result).toBe(`0xaaaa...aaaa`);
  });

  it('handles empty string gracefully', () => {
    expect(formatAddress('')).toBe('');
  });

  it('handles short addresses at the boundary', () => {
    const addr = '0x' + 'a'.repeat(12); // 14 chars total (6*2+2)
    expect(formatAddress(addr)).toBe(addr);
  });
});

describe('isValidIotaAddress', () => {
  it('returns true for a valid 64-hex + 0x address', () => {
    expect(isValidIotaAddress(FULL_ADDR)).toBe(true);
  });

  it('accepts uppercase hex', () => {
    expect(isValidIotaAddress('0x' + 'A'.repeat(64))).toBe(true);
  });

  it('accepts mixed case hex', () => {
    expect(isValidIotaAddress('0x' + 'aAbBcCdD'.repeat(8))).toBe(true);
  });

  it('returns false for too short address', () => {
    expect(isValidIotaAddress('0x' + 'a'.repeat(63))).toBe(false);
  });

  it('returns false for too long address', () => {
    expect(isValidIotaAddress('0x' + 'a'.repeat(65))).toBe(false);
  });

  it('returns false if missing 0x prefix', () => {
    expect(isValidIotaAddress('a'.repeat(64))).toBe(false);
  });

  it('returns false for non-hex characters', () => {
    expect(isValidIotaAddress('0x' + 'g'.repeat(64))).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidIotaAddress('')).toBe(false);
  });
});
