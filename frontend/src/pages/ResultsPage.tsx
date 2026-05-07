import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WinnersBoard from '../components/WinnersBoard';
import AllEntriesTable from '../components/AllEntriesTable';
import { useGame } from '../hooks/useGame';
import { formatDateTime } from '../utils/timeUtils';
import { nanosToUSD } from '../utils/priceCalc';
import { useIotaPrice } from '../hooks/useIotaPrice';

export default function ResultsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { game, isLoading } = useGame(gameId ?? '');
  const { priceUSD } = useIotaPrice();

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="text-amber-400 animate-pulse">Loading results...</div>
      </div>
    </div>
  );

  if (!game) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="text-center py-20 text-gray-400">Results not found</div>
    </div>
  );

  const potUSD = nanosToUSD(game.potNanos, priceUSD);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-amber-400 font-bold text-4xl mb-2">🏆 Pot #{game.gameId} — Results</h1>
          {game.revealedAtMs && <p className="text-gray-400">Revealed {formatDateTime(game.revealedAtMs)}</p>}
          <p className="text-gray-300 mt-1">
            Total Pot: <span className="text-white font-semibold">{game.potIOTA.toFixed(4)} IOTA</span>{' '}
            <span className="text-gray-500">(${potUSD.toFixed(2)} USD)</span>
          </p>
          <p className="text-gray-500 text-sm">{game.players.length} unique players · verifiable on-chain randomness</p>
        </div>
        <WinnersBoard game={game} />
        <AllEntriesTable game={game} />
        <div className="flex gap-4 justify-center">
          <Link to="/" className="px-6 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-lg transition-colors text-sm">
            ← Back to Home
          </Link>
          <a
            href={`https://explorer.iota.org/object/${game.objectId}?network=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-lg transition-colors text-sm border border-teal-500/30"
          >
            View on IOTA Explorer ↗
          </a>
        </div>
      </main>
    </div>
  );
}
