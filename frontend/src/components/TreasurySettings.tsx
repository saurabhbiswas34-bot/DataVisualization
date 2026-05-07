import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount, useIotaClientQuery } from '@iota/dapp-kit';
import { buildUpdateTreasuryTx } from '../transactions/updateTreasury';
import { useNetworkVariable } from '../networkConfig';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { isValidIotaAddress } from '../utils/formatAddress';

export default function TreasurySettings({ currentTreasury }: { currentTreasury: string }) {
  const packageId = useNetworkVariable('packageId');
  const globalConfigId = useNetworkVariable('globalConfigId');
  const account = useCurrentAccount();
  const { isAdmin } = useIsAdmin();
  const { data: ownedObjects } = useIotaClientQuery('getOwnedObjects', {
    owner: account?.address ?? '',
    filter: { StructType: `${packageId}::matka_pot::AdminCap` },
    options: { showContent: true },
  }, { enabled: !!account?.address && isAdmin && packageId !== '0xTODO' });
  // A deployment produces exactly one AdminCap; [0] is safe for standard setups.
  const adminCapId = ownedObjects?.data?.[0]?.data?.objectId ?? '';

  const [newAddress, setNewAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const isValid = isValidIotaAddress(newAddress);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !adminCapId) return;
    setStatus('pending');
    const tx = buildUpdateTreasuryTx(packageId, adminCapId, globalConfigId, newAddress);
    signAndExecute({ transaction: tx }, {
      onSuccess: () => { setStatus('success'); setMsg('✓ Treasury address updated'); setNewAddress(''); },
      onError: (err) => { setStatus('error'); setMsg(`Failed: ${err.message}`); },
    });
  };

  return (
    <div className="bg-gray-900 border border-purple-500/20 rounded-xl p-5 space-y-4">
      <h3 className="text-white font-semibold">🏦 Treasury Address</h3>
      <div>
        <p className="text-gray-500 text-xs mb-1">Current treasury:</p>
        <p className="font-mono text-teal-400 text-sm break-all bg-gray-800 rounded px-2 py-1">{currentTreasury || 'Loading...'}</p>
      </div>
      <form onSubmit={handleUpdate} className="space-y-3">
        <div>
          <label className="text-gray-400 text-sm block mb-1">New Treasury Address</label>
          <input
            type="text" value={newAddress} onChange={e => setNewAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
          />
          {newAddress && !isValid && <p className="text-red-400 text-xs mt-1">Invalid IOTA address format</p>}
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 text-orange-400 text-xs">
          ⚠ Changing this redirects all future admin cuts to the new address
        </div>
        {status !== 'idle' && (
          <div className={`rounded-lg p-2 text-sm ${status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
            {status === 'pending' ? 'Updating...' : msg}
          </div>
        )}
        <button type="submit" disabled={!isValid || !adminCapId || status === 'pending'}
          className="w-full bg-purple-500 hover:bg-purple-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded-lg transition-colors text-sm">
          UPDATE TREASURY
        </button>
      </form>
    </div>
  );
}
