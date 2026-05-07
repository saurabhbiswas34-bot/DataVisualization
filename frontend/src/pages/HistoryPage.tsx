import Navbar from '../components/Navbar';
import HistoryCard from '../components/HistoryCard';
import { useActiveGames } from '../hooks/useActiveGames';
import { isInHistory } from '../utils/timeUtils';

export default function HistoryPage() {
  const { allGames, isLoading } = useActiveGames();
  const historyGames = allGames
    .filter(isInHistory)
    .sort((a, b) => (b.revealedAtMs ?? 0) - (a.revealedAtMs ?? 0));

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-white font-bold text-3xl">📜 Pot History</h1>
          <p className="text-gray-400 mt-1">
            All completed pots older than 3 days · Full transparency — every entry and winner on-chain
          </p>
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : historyGames.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400">No completed pots yet</p>
            <p className="text-gray-600 text-sm mt-2">Pots appear here 3 days after they are revealed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {historyGames.map(game => <HistoryCard key={game.objectId} game={game} />)}
          </div>
        )}
      </main>
    </div>
  );
}
