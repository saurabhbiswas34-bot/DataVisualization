import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount, useIotaClientQuery } from '@iota/dapp-kit';
import { buildCreateGameTx } from '../transactions/createGame';
import { useNetworkVariable } from '../networkConfig';
import { MIN_GAME_DURATION_MS, LOCKOUT_DURATION_MS } from '../networkConfig';
import { useIsAdmin } from '../hooks/useIsAdmin';

export default function CreateGameForm() {
  const packageId = useNetworkVariable('packageId');
  const globalConfigId = useNetworkVariable('globalConfigId');
  const account = useCurrentAccount();
  const { isAdmin } = useIsAdmin();

  const { data: ownedObjects } = useIotaClientQuery('getOwnedObjects', {
    owner: account?.address ?? '',
    filter: { StructType: `${packageId}::matka_pot::AdminCap` },
    options: { showContent: true },
  }, { enabled: !!account?.address && isAdmin && packageId !== '0xTODO' });
  const adminCapId = ownedObjects?.data?.[0]?.data?.objectId ?? '';

  const [revealDate, setRevealDate] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const now = new Date();
  const minDate = new Date(now.getTime() + MIN_GAME_DURATION_MS + 60_000);
  const minDateStr = minDate.toISOString().slice(0, 16);

  const getRevealMs = () => revealDate ? new Date(revealDate).getTime() : 0;
  const isValidDate = revealDate && getRevealMs() > Date.now() + MIN_GAME_DURATION_MS;
  const lockoutTime = revealDate ? new Date(getRevealMs() - LOCKOUT_DURATION_MS) : null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDate || !adminCapId) return;
    setStatus('pending');
    const tx = buildCreateGameTx(packageId, adminCapId, globalConfigId, getRevealMs());
    signAndExecute({ transaction: tx }, {
      onSuccess: (result) => {
        setStatus('success');
        setMsg(`✓ Pot created! Tx: ${(result as { digest?: string }).digest ?? 'confirmed'}`);
        setRevealDate('');
      },
      onError: (err) => { setStatus('error'); setMsg(`Failed: ${err.message}`); },
    });
  };

  return (
    <div className="bg-gray-900 border border-amber-400/20 rounded-xl p-6 space-y-4">
      <h2 className="text-white font-bold text-xl">🎰 Create New Pot</h2>

      {!adminCapId && packageId !== '0xTODO' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          AdminCap not found in wallet. Ensure this is the admin wallet that deployed the contract.
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm block mb-1">Reveal Date &amp; Time</label>
          <input
            type="datetime-local" value={revealDate} onChange={e => setRevealDate(e.target.value)}
            min={minDateStr}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          />
          {revealDate && !isValidDate && (
            <p className="text-red-400 text-xs mt-1">Must be more than 24 hours from now</p>
          )}
          {isValidDate && (
            <p className="text-green-400 text-xs mt-1">
              ✓ Valid · Entries close at: {lockoutTime?.toLocaleString()} (10 min before reveal)
            </p>
          )}
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 space-y-1 text-sm">
          <p className="text-gray-400 font-medium mb-2">Prize Distribution (on-chain)</p>
          <div className="grid grid-cols-4 gap-1 text-xs text-gray-500 mb-1 font-medium">
            <span></span><span className="text-center">1 player</span><span className="text-center">2 players</span><span className="text-center">3+ players</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-xs">
            <span className="text-gray-400">🥇 1st</span><span className="text-amber-400 text-center">90%</span><span className="text-amber-400 text-center">50%</span><span className="text-amber-400 text-center">50%</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-xs">
            <span className="text-gray-400">🥈 2nd</span><span className="text-gray-600 text-center">—</span><span className="text-gray-300 text-center">40%</span><span className="text-gray-300 text-center">30%</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-xs">
            <span className="text-gray-400">🥉 3rd</span><span className="text-gray-600 text-center">—</span><span className="text-gray-600 text-center">—</span><span className="text-orange-400 text-center">10%</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-xs border-t border-gray-700 pt-1 mt-1">
            <span className="text-gray-500">🏦 Treasury</span><span className="text-gray-500 text-center">10%</span><span className="text-gray-500 text-center">~10%</span><span className="text-gray-500 text-center">~10%</span>
          </div>
        </div>

        {status !== 'idle' && (
          <div className={`rounded-lg p-3 text-sm ${status === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-gray-800 text-gray-400'}`}>
            {status === 'pending' ? 'Creating pot...' : msg}
          </div>
        )}

        <button
          type="submit"
          disabled={!isValidDate || !adminCapId || status === 'pending'}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-bold py-3 rounded-lg transition-colors"
        >
          {status === 'pending' ? 'Creating...' : 'CREATE POT'}
        </button>
      </form>
    </div>
  );
}
