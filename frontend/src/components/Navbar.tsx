import { ConnectButton } from '@iota/dapp-kit';
import { Link, useLocation } from 'react-router-dom';
import { useIsAdmin } from '../hooks/useIsAdmin';

export default function Navbar() {
  const { isAdmin } = useIsAdmin();
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path ? 'text-amber-400' : 'text-gray-400 hover:text-white';

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-amber-400 font-bold text-xl">
          🎰 IOTA Matka Pot
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/')}`}>Home</Link>
          <Link to="/history" className={`text-sm font-medium transition-colors ${isActive('/history')}`}>History</Link>
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full hover:bg-amber-400/10 transition-colors">
              👑 Admin
            </Link>
          )}
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
}
