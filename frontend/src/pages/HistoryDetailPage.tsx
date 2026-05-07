import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WinnersBoard from '../components/WinnersBoard';
import AllEntriesTable from '../components/AllEntriesTable';
import { useGame } from '../hooks/useGame';
import { formatDateTime } from '../utils/timeUtils';
import { nanosToUSD } from '../utils/priceCalc';
import { useIotaPrice } from '../hooks/useIotaPrice';
import { ACTIVE_NETWORK } from '../networkConfig';

export default function HistoryDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { game, isLoading } = useGame(gameId ?? '');
  const { priceUSD } = useIotaPrice();

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="text-amber-400 animate-pulse">Loading...</div>
      </div>
    </div>
  );

  if (!game) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="text-center py-20 text-gray-400">Game not found</div>
    </div>
  );

  const potUSD = nanosToUSD(game.potNanos, priceUSD);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <p className="text-gray-500 text-sm">
            <Link to="/history" className="hover:text-white">History</Link> &gt; Pot #{game.gameId}
          </p>
          <h1 className="text-white font-bold text-3xl mt-2">Pot #{game.gameId} — Full Details</h1>
          <div className="flex gap-6 mt-2 text-sm text-gray-500 flex-wrap">
            <span>Created: {formatDateTime(game.createdAtMs)}</span>
            {game.revealedAtMs && <span>Revealed: {formatDateTime(game.revealedAtMs)}</span>}
            <span>Total: {game.potIOTA.toFixed(4)} IOTA (${potUSD.toFixed(2)})</span>
          </div>
        </div>
        <WinnersBoard game={game} />
        <AllEntriesTable game={game} />
        <div className="flex gap-4">
          <Link to="/history" className="px-6 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-lg text-sm">
            ← Back to History
          </Link>
          <a
            href={`https://explorer.iota.org/object/${game.objectId}?network=${ACTIVE_NETWORK}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-lg text-sm border border-teal-500/30"
          >
            View on IOTA Explorer ↗
          </a>
        </div>
      </main>
    </div>
  );
}
