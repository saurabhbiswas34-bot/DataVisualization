import { useParams, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import CountdownTimer from '../components/CountdownTimer';
import PlayersList from '../components/PlayersList';
import PriceDisplay from '../components/PriceDisplay';
import { useGame } from '../hooks/useGame';
import { getGameStatus, formatDateTime } from '../utils/timeUtils';
import { formatIOTA, iotaToNanos } from '../utils/formatIOTA';
import { nanosToUSD, calcPrizeBreakdown } from '../utils/priceCalc';
import { useIotaPrice } from '../hooks/useIotaPrice';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { buildAddToPotTx } from '../transactions/addToPot';
import { useNetworkVariable } from '../networkConfig';

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { game, isLoading } = useGame(gameId ?? '');
  const { priceUSD, minEntryIOTA } = useIotaPrice();
  const account = useCurrentAccount();
  const packageId = useNetworkVariable('packageId');
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [amount, setAmount] = useState('');
  const [entropy, setEntropy] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [txMsg, setTxMsg] = useState('');

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="text-amber-400 animate-pulse text-xl">Loading pot...</div>
      </div>
    </div>
  );

  if (!game) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="text-center py-20 text-gray-400">Pot not found</div>
    </div>
  );

  const status = getGameStatus(game);
  if (status === 'revealed' || status === 'history') {
    return <Navigate to={`/game/${game.objectId}/results`} replace />;
  }

  const isLocked = status === 'locked';
  const potUSD = nanosToUSD(game.potNanos, priceUSD);
  const playerCount = game.players.length;
  const entryCount = playerCount + 1;
  const amtParsed = parseFloat(amount);
  const prizes = calcPrizeBreakdown(
    game.potNanos + (amtParsed > 0 ? iotaToNanos(amtParsed) : 0n),
    entryCount,
    priceUSD
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amtIOTA = parseFloat(amount);
    if (isNaN(amtIOTA) || amtIOTA < minEntryIOTA) return;
    const amtNanos = iotaToNanos(amtIOTA);
    const tx = buildAddToPotTx(packageId, game.objectId, amtNanos, entropy);
    signAndExecute({ transaction: tx }, {
      onSuccess: () => {
        setTxStatus('success');
        setTxMsg('✓ Entry confirmed! Ticket sent to your wallet.');
        setAmount('');
        setEntropy('');
      },
      onError: (err) => {
        setTxStatus('error');
        setTxMsg(`Transaction failed: ${err.message}`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500 text-sm mb-4">
          <a href="/" className="hover:text-white">Home</a> &gt; Pot #{game.gameId}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-white font-bold text-3xl">Pot #{game.gameId}</h1>
                <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${isLocked ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                  {isLocked ? 'LOCKED' : 'OPEN'}
                </span>
              </div>
              <p className="text-amber-400 font-bold text-4xl">{game.potIOTA.toFixed(4)} IOTA</p>
              <p className="text-gray-500">${potUSD.toFixed(2)} USD · {playerCount} unique player{playerCount !== 1 ? 's' : ''}</p>
              <p className="text-gray-600 text-sm mt-2">Created {formatDateTime(game.createdAtMs)}</p>
              <p className="text-gray-600 text-sm">Min contribution: {formatIOTA(game.minContributionNanos, 2)} IOTA</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              {isLocked ? (
                <div className="text-center">
                  <p className="text-orange-400 font-semibold text-lg animate-pulse">🔒 Entries Locked</p>
                  <p className="text-gray-500 text-sm mt-1">No new entries 10 minutes before reveal</p>
                  <div className="mt-4">
                    <CountdownTimer targetMs={game.revealTimestampMs} label="Revealing In" />
                  </div>
                </div>
              ) : (
                <CountdownTimer targetMs={game.revealTimestampMs} label="Pot Reveals In" />
              )}
            </div>

            <PlayersList game={game} />
          </div>

          {/* Right column — contribution form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 sticky top-4 space-y-4">
              <h2 className="text-white font-bold text-xl">Enter This Pot</h2>
              <PriceDisplay />

              {!account ? (
                <div className="text-center py-4 text-gray-400 text-sm">Connect your wallet to enter</div>
              ) : isLocked ? (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center text-orange-400">
                  🔒 Entries closed — pot locked for reveal
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">
                      Amount (IOTA) <span className="text-gray-600">· min {minEntryIOTA.toFixed(2)} IOTA</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={minEntryIOTA.toFixed(2)}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder={minEntryIOTA.toFixed(2)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                    {amount && (
                      <p className="text-gray-500 text-xs mt-1">
                        ≈ ${(parseFloat(amount) * priceUSD).toFixed(2)} USD
                      </p>
                    )}
                    {amount && parseFloat(amount) < minEntryIOTA && (
                      <p className="text-red-400 text-xs mt-1">
                        Minimum entry is {minEntryIOTA.toFixed(2)} IOTA (~$1.00)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">
                      🎲 Lucky Phrase <span className="text-gray-600">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={entropy}
                      onChange={e => setEntropy(e.target.value)}
                      placeholder="e.g. lucky 7, my birthday..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                    <p className="text-gray-600 text-xs mt-1">Mixed with on-chain randomness for the draw</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-3 space-y-1 text-sm">
                    <p className="text-gray-400 font-medium mb-2">Prize Preview ({entryCount} players)</p>
                    <div className="flex justify-between">
                      <span className="text-gray-400">🥇 1st:</span>
                      <span className="text-amber-400 font-medium">{prizes.prize1IOTA.toFixed(2)} IOTA</span>
                    </div>
                    {entryCount >= 2 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">🥈 2nd:</span>
                        <span className="text-gray-300">{prizes.prize2IOTA.toFixed(2)} IOTA</span>
                      </div>
                    )}
                    {entryCount >= 3 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">🥉 3rd:</span>
                        <span className="text-orange-400">{prizes.prize3IOTA.toFixed(2)} IOTA</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                      <span className="text-gray-500">🏦 Treasury:</span>
                      <span className="text-gray-500">{prizes.treasuryIOTA.toFixed(2)} IOTA</span>
                    </div>
                  </div>

                  {txStatus !== 'idle' && (
                    <div className={`rounded-lg p-3 text-sm ${txStatus === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                      {txMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending || !amount || parseFloat(amount) < minEntryIOTA}
                    className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-bold py-3 rounded-lg transition-colors"
                  >
                    {isPending ? 'Confirming...' : 'ENTER POT'}
                  </button>
                  <p className="text-gray-600 text-xs text-center">
                    Prizes distributed automatically at reveal · Powered by IOTA Move
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
