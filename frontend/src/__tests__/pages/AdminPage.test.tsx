import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminPage from '../../pages/AdminPage';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, ADMIN_CAP_ID, PACKAGE_ID, GLOBAL_CONFIG_ID } from '../../test-utils/factories';

const mockUseCurrentAccount = vi.fn();
const mockUseIsAdmin = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useCurrentAccount: () => mockUseCurrentAccount(),
  ConnectButton: () => <button>Connect Wallet</button>,
  useSignAndExecuteTransaction: () => ({ mutate: vi.fn() }),
  useIotaClientQuery: () => ({
    data: {
      data: {
        content: {
          fields: {
            admin_address: ADMIN_ADDRESS,
            treasury_address: ADMIN_ADDRESS,
            game_counter: '3',
            min_contribution_nanos: '17200000000',
          },
        },
      },
    },
  }),
}));

vi.mock('../../hooks/useIsAdmin', () => ({ useIsAdmin: () => mockUseIsAdmin() }));
vi.mock('../../hooks/useActiveGames', () => ({
  useActiveGames: () => ({ activeGames: [], allGames: [], isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 1.0, minEntryNanos: 1_000_000_000n, minEntryIOTA: 1.0, isLoading: false }),
}));
vi.mock('../../hooks/useAutoReveal', () => ({ useAutoReveal: vi.fn() }));
vi.mock('../../networkConfig', () => ({
  useNetworkVariable: (key: string) => {
    if (key === 'packageId') return PACKAGE_ID;
    if (key === 'globalConfigId') return GLOBAL_CONFIG_ID;
    if (key === 'adminAddress') return ADMIN_ADDRESS;
    return '';
  },
  RANDOM_OBJECT_ID: '0x8',
  CLOCK_OBJECT_ID: '0x6',
  MIN_GAME_DURATION_MS: 86_400_000,
  LOCKOUT_DURATION_MS: 600_000,
  HISTORY_THRESHOLD_MS: 259_200_000,
  PRIZE_PCTS: {},
  ACTIVE_NETWORK: 'testnet',
}));

describe('AdminPage — unauthenticated', () => {
  it('shows "Admin Access Required" for disconnected wallet', () => {
    mockUseCurrentAccount.mockReturnValue(null);
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, adminAddress: '' });
    render(<AdminPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Admin Access Required/i)).toBeInTheDocument();
  });

  it('shows Access Denied for wrong wallet', () => {
    mockUseCurrentAccount.mockReturnValue({ address: '0x' + 'f'.repeat(64) });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, adminAddress: ADMIN_ADDRESS });
    render(<AdminPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
  });
});

describe('AdminPage — authenticated admin', () => {
  beforeEach(() => {
    mockUseCurrentAccount.mockReturnValue({ address: ADMIN_ADDRESS });
    mockUseIsAdmin.mockReturnValue({ isAdmin: true, adminAddress: ADMIN_ADDRESS });
  });

  it('shows "Admin Control Panel" heading', () => {
    render(<AdminPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Admin Control Panel/i)).toBeInTheDocument();
  });

  it('shows game statistics', () => {
    render(<AdminPage />, { wrapper: Wrapper });
    expect(screen.getByText('Total Games Created')).toBeInTheDocument();
    expect(screen.getByText('Active Games')).toBeInTheDocument();
    expect(screen.getByText('Total Treasury Earned')).toBeInTheDocument();
    expect(screen.getByText('Min Entry')).toBeInTheDocument();
  });

  it('shows CreateGameForm', () => {
    render(<AdminPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Create New Pot/i)).toBeInTheDocument();
  });

  it('shows TreasurySettings', () => {
    render(<AdminPage />, { wrapper: Wrapper });
    expect(screen.getAllByText(/Treasury Address/i)[0]).toBeInTheDocument();
  });

  it('shows MinContributionUpdater', () => {
    render(<AdminPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Min Contribution/i)).toBeInTheDocument();
  });

  it('shows RevealWatcher', () => {
    render(<AdminPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Auto-Reveal Watcher/i)).toBeInTheDocument();
  });
});
