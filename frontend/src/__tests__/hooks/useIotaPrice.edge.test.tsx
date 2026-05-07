/**
 * Edge cases for useIotaPrice:
 * - Both providers fail → error field populated
 * - Binance ok: false → falls through to error
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIotaPrice } from '../../hooks/useIotaPrice';
import { Wrapper } from '../../test-utils/wrappers';

describe('useIotaPrice — error paths', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it('returns error string when both CoinGecko and Binance fail (network error)', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useIotaPrice(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(typeof result.current.error).toBe('string');
  });

  it('falls back to Binance when CoinGecko returns ok:false, then Binance ok:false → error', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false } as any)  // CoinGecko fails
      .mockResolvedValueOnce({ ok: false } as any); // Binance also fails → throws

    const { result } = renderHook(() => useIotaPrice(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
  });

  it('error stays null on successful fetch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ iota: { usd: 1.5 } }),
    } as any);

    const { result } = renderHook(() => useIotaPrice(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.priceUSD).toBeGreaterThan(0);
    });

    expect(result.current.error).toBeNull();
  });
});
