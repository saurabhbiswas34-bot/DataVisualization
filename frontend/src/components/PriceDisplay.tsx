import { useIotaPrice } from '../hooks/useIotaPrice';

interface Props { className?: string; }

export default function PriceDisplay({ className = '' }: Props) {
  const { priceUSD, minEntryIOTA, isLoading } = useIotaPrice();
  if (isLoading) return <div className={`text-gray-500 text-sm ${className}`}>Loading price...</div>;
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-gray-300">
        1 IOTA = <span className="text-green-400 font-medium">${priceUSD.toFixed(4)} USD</span>
        &nbsp;·&nbsp;Min entry: <span className="text-amber-400 font-medium">{minEntryIOTA.toFixed(2)} IOTA (~$1.00)</span>
      </span>
    </div>
  );
}
