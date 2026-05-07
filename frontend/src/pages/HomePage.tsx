import Navbar from '../components/Navbar';
import PotCard from '../components/PotCard';
import PriceDisplay from '../components/PriceDisplay';
import { useActiveGames } from '../hooks/useActiveGames';

export default function HomePage() {
  const { activeGames, isLoading } = useActiveGames();

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-white font-bold text-4xl mb-2">🎰 Active Pots</h1>
          <p className="text-gray-400">Connect your IOTA wallet and enter a pot to win big</p>
          <div className="mt-3">
            <PriceDisplay />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : activeGames.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🪣</div>
            <p className="text-gray-400 text-xl">No active pots right now</p>
            <p className="text-gray-600 text-sm mt-2">Check back soon or ask the admin to create a new game</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGames.map(game => <PotCard key={game.objectId} game={game} />)}
          </div>
        )}
      </main>
    </div>
  );
}
