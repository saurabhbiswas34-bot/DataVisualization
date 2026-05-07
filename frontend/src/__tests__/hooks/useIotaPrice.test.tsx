import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIotaPrice } from '../../hooks/useIotaPrice';
import { Wrapper } from '../../test-utils/wrappers';

describe('useIotaPrice', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches price from CoinGecko and returns priceUSD', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ iota: { usd: 0.42 } }),
    } as any);

    const { result } = renderHook(() => useIotaPrice(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.priceUSD).toBeCloseTo(0.42);
    });
  });

  it('falls back to Binance when CoinGecko fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ price: '0.55' }),
      } as any);

    const { result } = renderHook(() => useIotaPrice(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.priceUSD).toBeCloseTo(0.55);
    });
  });

  it('returns isLoading=true initially', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useIotaPrice(), { wrapper: Wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns minEntryNanos > 0n when price is known', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ iota: { usd: 1.0 } }),
    } as any);

    const { result } = renderHook(() => useIotaPrice(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.minEntryNanos).toBeGreaterThan(0n);
    });
  });

  it('returns minEntryIOTA > 0 when price is known', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ iota: { usd: 2.0 } }),
    } as any);

    const { result } = renderHook(() => useIotaPrice(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.minEntryIOTA).toBeGreaterThan(0);
    });
  });

  it('returns 0 defaults before data arrives', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useIotaPrice(), { wrapper: Wrapper });
    expect(result.current.priceUSD).toBe(0);
    expect(result.current.minEntryNanos).toBe(0n);
    expect(result.current.minEntryIOTA).toBe(0);
  });
});
