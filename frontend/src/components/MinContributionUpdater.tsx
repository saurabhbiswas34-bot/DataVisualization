import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount, useIotaClientQuery } from '@iota/dapp-kit';
import { buildUpdateMinEntryTx } from '../transactions/updateMinEntry';
import { useNetworkVariable } from '../networkConfig';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useIotaPrice } from '../hooks/useIotaPrice';
import { formatIOTA } from '../utils/formatIOTA';

export default function MinContributionUpdater({ currentMinNanos }: { currentMinNanos: bigint }) {
  const packageId = useNetworkVariable('packageId');
  const globalConfigId = useNetworkVariable('globalConfigId');
  const account = useCurrentAccount();
  const { isAdmin } = useIsAdmin();
  const { priceUSD, minEntryNanos, minEntryIOTA } = useIotaPrice();
  const { data: ownedObjects } = useIotaClientQuery('getOwnedObjects', {
    owner: account?.address ?? '',
    filter: { StructType: `${packageId}::matka_pot::AdminCap` },
    options: { showContent: true },
  }, { enabled: !!account?.address && isAdmin && packageId !== '0xTODO' });
  const adminCapId = ownedObjects?.data?.[0]?.data?.objectId ?? '';

  const [customNanos, setCustomNanos] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const targetNanos = customNanos ? BigInt(customNanos) : minEntryNanos;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCapId || targetNanos === 0n) return;
    setStatus('pending');
    const tx = buildUpdateMinEntryTx(packageId, adminCapId, globalConfigId, targetNanos);
    signAndExecute({ transaction: tx }, {
      onSuccess: () => { setStatus('success'); setMsg('✓ Minimum contribution updated'); setCustomNanos(''); },
      onError: (err) => { setStatus('error'); setMsg(`Failed: ${err.message}`); },
    });
  };

  return (
    <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-5 space-y-4">
      <h3 className="text-white font-semibold">💰 Min Contribution</h3>
      <div className="flex items-center gap-2 text-sm">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-gray-400">IOTA = <span className="text-green-400">${priceUSD.toFixed(4)} USD</span></span>
      </div>
      <div>
        <p className="text-gray-500 text-xs">Current on-chain minimum:</p>
        <p className="text-white font-medium">{formatIOTA(currentMinNanos)} IOTA <span className="text-gray-500 text-sm">(${(Number(currentMinNanos) / 1e9 * priceUSD).toFixed(2)} USD)</span></p>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm">
        <p className="text-blue-400 font-medium">Recommended for $1.00 USD:</p>
        <p className="text-white font-bold">{minEntryIOTA.toFixed(4)} IOTA</p>
        <p className="text-gray-500 text-xs">{minEntryNanos.toString()} NANOS</p>
      </div>
      <form onSubmit={handleUpdate} className="space-y-3">
        <div>
          <label className="text-gray-400 text-sm block mb-1">Custom amount (NANOS) — or leave blank for live $1 USD</label>
          <input type="number" value={customNanos} onChange={e => setCustomNanos(e.target.value)}
            placeholder={minEntryNanos.toString()}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <button type="button" onClick={() => setCustomNanos(minEntryNanos.toString())}
          className="text-teal-400 text-sm hover:underline">↑ Sync to live $1.00 USD</button>
        {status !== 'idle' && (
          <div className={`rounded-lg p-2 text-sm ${status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
            {status === 'pending' ? 'Updating...' : msg}
          </div>
        )}
        <button type="submit" disabled={!adminCapId || status === 'pending'}
          className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded-lg transition-colors text-sm">
          UPDATE ON-CHAIN
        </button>
      </form>
    </div>
  );
}
