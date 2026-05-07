import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '../../pages/HomePage';
import { Wrapper } from '../../test-utils/wrappers';
import { makeGame } from '../../test-utils/factories';

vi.mock('../../hooks/useActiveGames', () => ({ useActiveGames: vi.fn() }));
vi.mock('../../hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: false }) }));
vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 1.0, minEntryIOTA: 1.0, isLoading: false }),
}));
vi.mock('@iota/dapp-kit', () => ({
  ConnectButton: () => <button>Connect</button>,
}));
vi.mock('../../networkConfig', () => ({
  useNetworkVariable: () => '0xpkg',
  RANDOM_OBJECT_ID: '0x8',
  CLOCK_OBJECT_ID: '0x6',
  MIN_GAME_DURATION_MS: 86_400_000,
  LOCKOUT_DURATION_MS: 600_000,
  HISTORY_THRESHOLD_MS: 259_200_000,
  PRIZE_PCTS: {},
  ACTIVE_NETWORK: 'testnet',
}));

import { useActiveGames } from '../../hooks/useActiveGames';

describe('HomePage', () => {
  it('renders "Active Pots" heading', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: false, error: null, refetch: vi.fn() });
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { name: /Active Pots/i })).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: true, error: null, refetch: vi.fn() });
    const { container } = render(<HomePage />, { wrapper: Wrapper });
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no active games', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: false, error: null, refetch: vi.fn() });
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText(/No active pots right now/i)).toBeInTheDocument();
  });

  it('renders PotCard for each active game', () => {
    const games = [makeGame({ gameId: 1 }), makeGame({ gameId: 2, objectId: '0x' + '2'.repeat(64) })];
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: games, allGames: games, isLoading: false, error: null, refetch: vi.fn() });
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('Pot #1')).toBeInTheDocument();
    expect(screen.getByText('Pot #2')).toBeInTheDocument();
  });

  it('shows PriceDisplay min entry', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: false, error: null, refetch: vi.fn() });
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText(/Min entry/i)).toBeInTheDocument();
  });
});
