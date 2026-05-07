import { ConnectButton } from '@iota/dapp-kit';
import { useIsAdmin } from '../hooks/useIsAdmin';

export default function Navbar() {
  const { isAdmin } = useIsAdmin();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="text-amber-400 font-bold text-xl tracking-tight hover:text-amber-300 transition-colors">
            🎰 IOTA Matka Pot
          </a>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a>
            <a href="/history" className="text-gray-400 hover:text-white transition-colors">History</a>
            {isAdmin && (
              <a href="/admin" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
                Admin
              </a>
            )}
          </div>
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
}
