import { useQuery } from '@tanstack/react-query';
import { usdToNanos } from '../utils/priceCalc';
import { nanosToIOTA } from '../utils/formatIOTA';

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=iota&vs_currencies=usd';
const BINANCE_URL =
  'https://api.binance.com/api/v3/ticker/price?symbol=IOTAUSDT';

async function fetchPrice(): Promise<number> {
  try {
    const res = await fetch(COINGECKO_URL);
    if (!res.ok) throw new Error('CoinGecko failed');
    const data = await res.json();
    return data.iota.usd;
  } catch {
    const res = await fetch(BINANCE_URL);
    if (!res.ok) throw new Error('Binance failed');
    const data = await res.json();
    return parseFloat(data.price);
  }
}

export function useIotaPrice() {
  const { data: priceUSD, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['iota-price'],
    queryFn: fetchPrice,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const minEntryNanos = priceUSD ? usdToNanos(1, priceUSD) : 0n;
  const minEntryIOTA = priceUSD ? nanosToIOTA(minEntryNanos) : 0;

  return {
    priceUSD: priceUSD ?? 0,
    minEntryNanos,
    minEntryIOTA,
    isLoading,
    error: error ? String(error) : null,
    // dataUpdatedAt is the epoch ms when the last successful fetch completed,
    // not the current render time (which was always wrong before).
    lastUpdated: new Date(dataUpdatedAt),
  };
}
