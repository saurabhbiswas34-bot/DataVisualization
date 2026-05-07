import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils/wrappers';
import { screen } from '@testing-library/react';
import ResultsPage from '../../pages/ResultsPage';
import { makeRevealedGame, GAME_OBJECT_ID } from '../../test-utils/factories';

const mockUseGame = vi.fn();

vi.mock('../../hooks/useGame', () => ({ useGame: () => mockUseGame() }));
vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 1.0, isLoading: false }),
}));
vi.mock('../../hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: false }) }));
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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any;
  return { ...actual, useParams: () => ({ gameId: GAME_OBJECT_ID }) };
});

describe('ResultsPage', () => {
  it('shows loading spinner', () => {
    mockUseGame.mockReturnValue({ game: null, isLoading: true });
    const { container } = renderWithProviders(<ResultsPage />, { initialRoute: `/game/${GAME_OBJECT_ID}/results` });
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows "Results not found" when game is null', () => {
    mockUseGame.mockReturnValue({ game: null, isLoading: false });
    renderWithProviders(<ResultsPage />, { initialRoute: `/game/${GAME_OBJECT_ID}/results` });
    expect(screen.getByText(/Results not found/i)).toBeInTheDocument();
  });

  it('shows "Results" heading with game ID', () => {
    mockUseGame.mockReturnValue({ game: makeRevealedGame(), isLoading: false });
    renderWithProviders(<ResultsPage />, { initialRoute: `/game/${GAME_OBJECT_ID}/results` });
    expect(screen.getByText(/Pot #1 — Results/i)).toBeInTheDocument();
  });

  it('shows total pot', () => {
    mockUseGame.mockReturnValue({ game: makeRevealedGame(), isLoading: false });
    renderWithProviders(<ResultsPage />, { initialRoute: `/game/${GAME_OBJECT_ID}/results` });
    expect(screen.getByText(/Total Pot/i)).toBeInTheDocument();
  });

  it('shows "Back to Home" link', () => {
    mockUseGame.mockReturnValue({ game: makeRevealedGame(), isLoading: false });
    renderWithProviders(<ResultsPage />, { initialRoute: `/game/${GAME_OBJECT_ID}/results` });
    expect(screen.getByText(/Back to Home/i)).toBeInTheDocument();
  });

  it('shows IOTA Explorer link', () => {
    mockUseGame.mockReturnValue({ game: makeRevealedGame(), isLoading: false });
    renderWithProviders(<ResultsPage />, { initialRoute: `/game/${GAME_OBJECT_ID}/results` });
    expect(screen.getByText(/View on IOTA Explorer/i)).toBeInTheDocument();
  });

  it('shows unique player count', () => {
    mockUseGame.mockReturnValue({ game: makeRevealedGame(), isLoading: false });
    renderWithProviders(<ResultsPage />, { initialRoute: `/game/${GAME_OBJECT_ID}/results` });
    expect(screen.getAllByText(/3 unique players/i)[0]).toBeInTheDocument();
  });
});
