import Navbar from '../components/Navbar';
import AdminGuard from '../components/AdminGuard';
import CreateGameForm from '../components/CreateGameForm';
import TreasurySettings from '../components/TreasurySettings';
import MinContributionUpdater from '../components/MinContributionUpdater';
import RevealWatcher from '../components/RevealWatcher';
import { useIotaClientQuery } from '@iota/dapp-kit';
import { useNetworkVariable } from '../networkConfig';
import { useActiveGames } from '../hooks/useActiveGames';
import { formatIOTA } from '../utils/formatIOTA';
import { useIotaPrice } from '../hooks/useIotaPrice';

function AdminPanelContent() {
  const globalConfigId = useNetworkVariable('globalConfigId');
  const { priceUSD } = useIotaPrice();
  const { allGames } = useActiveGames();

  const { data: configObj } = useIotaClientQuery(
    'getObject',
    { id: globalConfigId, options: { showContent: true } },
    { enabled: !!globalConfigId && globalConfigId !== '0xTODO', refetchInterval: 30_000 }
  );
  const cfg = (configObj as { data?: { content?: { fields?: Record<string, string> } } })?.data?.content?.fields ?? {};
  const treasuryAddress: string = cfg.treasury_address ?? '';
  const minContribNanos: bigint = BigInt(cfg.min_contribution_nanos ?? '0');
  const gameCounter: number = parseInt(cfg.game_counter ?? '0');

  const totalTreasury = allGames
    .filter(g => !g.isActive)
    .reduce((sum, g) => sum + g.treasuryCutNanos, 0n);

  // Suppress unused variable warning — priceUSD retained for future stat display
  void priceUSD;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Games Created', value: String(gameCounter) },
          { label: 'Active Games', value: String(allGames.filter(g => g.isActive).length) },
          { label: 'Total Treasury Earned', value: `${formatIOTA(totalTreasury, 2)} IOTA` },
          { label: 'Min Entry', value: `${formatIOTA(minContribNanos, 2)} IOTA` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs">{label}</p>
            <p className="text-white font-bold text-lg mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreateGameForm />
        <div className="space-y-4">
          <TreasurySettings currentTreasury={treasuryAddress} />
          <MinContributionUpdater currentMinNanos={minContribNanos} />
        </div>
      </div>

      <RevealWatcher />
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-white font-bold text-3xl">🛡 Admin Control Panel</h1>
          <p className="text-gray-400 mt-1">Only accessible by the admin wallet · All actions require AdminCap on-chain</p>
        </div>
        <AdminGuard>
          <AdminPanelContent />
        </AdminGuard>
      </main>
    </div>
  );
}
