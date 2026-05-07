import { ReactNode } from 'react';
import { useCurrentAccount } from '@iota/dapp-kit';
import { ConnectButton } from '@iota/dapp-kit';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface Props { children: ReactNode; }

export default function AdminGuard({ children }: Props) {
  const account = useCurrentAccount();
  const { isAdmin, adminAddress } = useIsAdmin();

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔐</div>
          <h2 className="text-white font-bold text-2xl">Admin Access Required</h2>
          <p className="text-gray-400">Connect the admin wallet to access this panel</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">🚫</div>
          <h2 className="text-white font-bold text-2xl">Access Denied</h2>
          <p className="text-gray-400">This panel requires the admin wallet.</p>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-left space-y-2">
            <p className="text-gray-500 text-xs">Connected wallet:</p>
            <p className="text-teal-400 font-mono text-sm break-all">{account.address}</p>
            {adminAddress && (
              <>
                <p className="text-gray-500 text-xs mt-2">Admin wallet:</p>
                <p className="text-amber-400 font-mono text-sm break-all">{adminAddress}</p>
              </>
            )}
          </div>
          <a href="/" className="inline-block px-6 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-lg text-sm transition-colors">← Back to Home</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
