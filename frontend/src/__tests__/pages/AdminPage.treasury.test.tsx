/**
 * AdminPage — totalTreasury calculation with actual inactive games.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminPage from '../../pages/AdminPage';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, ADMIN_CAP_ID, PACKAGE_ID, GLOBAL_CONFIG_ID, makeRevealedGame } from '../../test-utils/factories';

vi.mock('@iota/dapp-kit', () => ({
  useCurrentAccount: () => ({ address: ADMIN_ADDRESS }),
  ConnectButton: () => <button>Connect Wallet</button>,
  useSignAndExecuteTransaction: () => ({ mutate: vi.fn() }),
  useIotaClientQuery: () => ({
    data: {
      data: {
        content: {
          fields: {
            admin_address: ADMIN_ADDRESS,
            treasury_address: ADMIN_ADDRESS,
            game_counter: '5',
            min_contribution_nanos: '17200000000',
          },
        },
      },
    },
  }),
}));

vi.mock('../../hooks/useIsAdmin', () => ({
  useIsAdmin: () => ({ isAdmin: true, adminAddress: ADMIN_ADDRESS }),
}));

vi.mock('../../hooks/useActiveGames', () => ({
  useActiveGames: vi.fn(),
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

import { useActiveGames } from '../../hooks/useActiveGames';

describe('AdminPage — totalTreasury with inactive games', () => {
  it('sums treasuryCutNanos from inactive games', () => {
    const game1 = makeRevealedGame({ treasuryCutNanos: 10_000_000_000n }); // 10 IOTA
    const game2 = makeRevealedGame({ objectId: '0x' + '2'.repeat(64), gameId: 2, treasuryCutNanos: 5_000_000_000n }); // 5 IOTA
    vi.mocked(useActiveGames).mockReturnValue({
      activeGames: [],
      allGames: [game1, game2],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AdminPage />, { wrapper: Wrapper });

    // totalTreasury = 15 IOTA; formatted as "15.00 IOTA"
    expect(screen.getByText(/15\.00 IOTA/)).toBeInTheDocument();
  });

  it('shows 0 IOTA when no inactive games exist', () => {
    vi.mocked(useActiveGames).mockReturnValue({
      activeGames: [],
      allGames: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AdminPage />, { wrapper: Wrapper });
    expect(screen.getByText(/0\.00 IOTA/)).toBeInTheDocument();
  });

  it('active games are excluded from treasury total', () => {
    const activeGame = { ...makeRevealedGame({ treasuryCutNanos: 999_000_000_000n }), isActive: true };
    vi.mocked(useActiveGames).mockReturnValue({
      activeGames: [activeGame],
      allGames: [activeGame],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AdminPage />, { wrapper: Wrapper });
    // Active game treasury not counted
    expect(screen.getByText(/0\.00 IOTA/)).toBeInTheDocument();
  });

  it('shows game counter from GlobalConfig', () => {
    vi.mocked(useActiveGames).mockReturnValue({
      activeGames: [],
      allGames: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AdminPage />, { wrapper: Wrapper });
    expect(screen.getByText('5')).toBeInTheDocument(); // game_counter = 5
  });
});
