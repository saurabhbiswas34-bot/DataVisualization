import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils/wrappers';
import { screen } from '@testing-library/react';
import HistoryDetailPage from '../../pages/HistoryDetailPage';
import { makeHistoryGame, GAME_OBJECT_ID } from '../../test-utils/factories';

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

describe('HistoryDetailPage', () => {
  it('shows loading state', () => {
    mockUseGame.mockReturnValue({ game: null, isLoading: true });
    const { container } = renderWithProviders(<HistoryDetailPage />, { initialRoute: `/history/${GAME_OBJECT_ID}` });
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows "Game not found" when null', () => {
    mockUseGame.mockReturnValue({ game: null, isLoading: false });
    renderWithProviders(<HistoryDetailPage />, { initialRoute: `/history/${GAME_OBJECT_ID}` });
    expect(screen.getByText(/Game not found/i)).toBeInTheDocument();
  });

  it('shows "Full Details" heading', () => {
    mockUseGame.mockReturnValue({ game: makeHistoryGame(), isLoading: false });
    renderWithProviders(<HistoryDetailPage />, { initialRoute: `/history/${GAME_OBJECT_ID}` });
    expect(screen.getByText(/Full Details/i)).toBeInTheDocument();
  });

  it('shows "Back to History" link', () => {
    mockUseGame.mockReturnValue({ game: makeHistoryGame(), isLoading: false });
    renderWithProviders(<HistoryDetailPage />, { initialRoute: `/history/${GAME_OBJECT_ID}` });
    expect(screen.getByText(/Back to History/i)).toBeInTheDocument();
  });

  it('shows IOTA Explorer link', () => {
    mockUseGame.mockReturnValue({ game: makeHistoryGame(), isLoading: false });
    renderWithProviders(<HistoryDetailPage />, { initialRoute: `/history/${GAME_OBJECT_ID}` });
    expect(screen.getByText(/View on IOTA Explorer/i)).toBeInTheDocument();
  });

  it('shows game timestamps', () => {
    mockUseGame.mockReturnValue({ game: makeHistoryGame(), isLoading: false });
    renderWithProviders(<HistoryDetailPage />, { initialRoute: `/history/${GAME_OBJECT_ID}` });
    expect(screen.getByText(/Created:/i)).toBeInTheDocument();
    expect(screen.getByText(/Revealed:/i)).toBeInTheDocument();
  });
});
