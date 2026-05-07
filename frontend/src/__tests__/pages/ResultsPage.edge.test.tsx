/**
 * ResultsPage and HistoryDetailPage edge cases:
 * - gameId undefined from useParams (maps to empty string for useGame)
 * - potUSD = 0 when priceUSD = 0
 */
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils/wrappers';
import { screen } from '@testing-library/react';
import ResultsPage from '../../pages/ResultsPage';
import HistoryDetailPage from '../../pages/HistoryDetailPage';
import { makeRevealedGame, makeHistoryGame, GAME_OBJECT_ID } from '../../test-utils/factories';

const mockUseGame = vi.fn();
const mockUseParams = vi.fn(() => ({ gameId: undefined as string | undefined }));

vi.mock('../../hooks/useGame', () => ({ useGame: () => mockUseGame() }));
vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 0, isLoading: false }),
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
  return { ...actual, useParams: () => mockUseParams() };
});

describe('ResultsPage — gameId undefined', () => {
  it('shows "Results not found" when gameId is undefined', () => {
    mockUseParams.mockReturnValue({ gameId: undefined });
    mockUseGame.mockReturnValue({ game: null, isLoading: false });
    renderWithProviders(<ResultsPage />, { initialRoute: '/game/undefined/results' });
    expect(screen.getByText(/Results not found/i)).toBeInTheDocument();
  });

  it('renders correctly with priceUSD=0 (shows $0.00 USD)', () => {
    mockUseParams.mockReturnValue({ gameId: GAME_OBJECT_ID });
    mockUseGame.mockReturnValue({ game: makeRevealedGame(), isLoading: false });
    renderWithProviders(<ResultsPage />, { initialRoute: `/game/${GAME_OBJECT_ID}/results` });
    // With priceUSD=0, USD display should show $0.00
    expect(screen.getAllByText(/\$0\.00 USD/i)[0]).toBeInTheDocument();
  });
});

describe('HistoryDetailPage — gameId undefined', () => {
  it('shows "Game not found" when gameId is undefined', () => {
    mockUseParams.mockReturnValue({ gameId: undefined });
    mockUseGame.mockReturnValue({ game: null, isLoading: false });
    renderWithProviders(<HistoryDetailPage />, { initialRoute: '/history/undefined' });
    expect(screen.getByText(/Game not found/i)).toBeInTheDocument();
  });

  it('renders correctly with priceUSD=0', () => {
    mockUseParams.mockReturnValue({ gameId: GAME_OBJECT_ID });
    mockUseGame.mockReturnValue({ game: makeHistoryGame(), isLoading: false });
    renderWithProviders(<HistoryDetailPage />, { initialRoute: `/history/${GAME_OBJECT_ID}` });
    expect(screen.getAllByText(/\$0\.00/i)[0]).toBeInTheDocument();
  });
});
