import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoryPage from '../../pages/HistoryPage';
import { Wrapper } from '../../test-utils/wrappers';
import { makeHistoryGame, makeGame } from '../../test-utils/factories';

vi.mock('../../hooks/useActiveGames', () => ({ useActiveGames: vi.fn() }));
vi.mock('../../hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: false }) }));
vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 1.0, isLoading: false }),
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

describe('HistoryPage', () => {
  it('renders "Pot History" heading', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: false, error: null, refetch: vi.fn() });
    render(<HistoryPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Pot History/i)).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: true, error: null, refetch: vi.fn() });
    const { container } = render(<HistoryPage />, { wrapper: Wrapper });
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty state when no history games', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: false, error: null, refetch: vi.fn() });
    render(<HistoryPage />, { wrapper: Wrapper });
    expect(screen.getByText(/No completed pots yet/i)).toBeInTheDocument();
  });

  it('active games do not appear in history', () => {
    const activeGame = makeGame();
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [activeGame], allGames: [activeGame], isLoading: false, error: null, refetch: vi.fn() });
    render(<HistoryPage />, { wrapper: Wrapper });
    expect(screen.getByText(/No completed pots yet/i)).toBeInTheDocument();
  });

  it('renders history cards for completed games', () => {
    const histGame = makeHistoryGame({ gameId: 5 });
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [histGame], isLoading: false, error: null, refetch: vi.fn() });
    render(<HistoryPage />, { wrapper: Wrapper });
    expect(screen.getByText('#5')).toBeInTheDocument();
  });
});
