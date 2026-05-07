import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import GameDetailPage from '../../pages/GameDetailPage';
import { renderWithProviders } from '../../test-utils/wrappers';
import {
  makeGame, makeRevealedGame, ADMIN_ADDRESS, GAME_OBJECT_ID, NOW,
} from '../../test-utils/factories';

const mockUseGame = vi.fn();
const mockUseCurrentAccount = vi.fn();
const mockSignAndExecute = vi.fn();

vi.mock('../../hooks/useGame', () => ({ useGame: () => mockUseGame() }));
vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 1.0, minEntryIOTA: 1.0, isLoading: false }),
}));
vi.mock('@iota/dapp-kit', () => ({
  useCurrentAccount: () => mockUseCurrentAccount(),
  useSignAndExecuteTransaction: () => ({ mutate: mockSignAndExecute, isPending: false }),
  ConnectButton: () => <button>Connect</button>,
}));
vi.mock('../../hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: false }) }));
vi.mock('../../networkConfig', () => ({
  useNetworkVariable: () => '0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a',
  RANDOM_OBJECT_ID: '0x0000000000000000000000000000000000000000000000000000000000000008',
  CLOCK_OBJECT_ID: '0x0000000000000000000000000000000000000000000000000000000000000006',
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

describe('GameDetailPage', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    mockUseCurrentAccount.mockReturnValue({ address: ADMIN_ADDRESS });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state', () => {
    mockUseGame.mockReturnValue({ game: null, isLoading: true });
    const { container } = renderWithProviders(<GameDetailPage />, {
      initialRoute: `/game/${GAME_OBJECT_ID}`,
    });
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows "Pot not found" when game is null', () => {
    mockUseGame.mockReturnValue({ game: null, isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    expect(screen.getByText(/Pot not found/i)).toBeInTheDocument();
  });

  it('renders pot number for open game', () => {
    mockUseGame.mockReturnValue({ game: makeGame(), isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    expect(screen.getByText('Pot #1')).toBeInTheDocument();
  });

  it('shows OPEN status badge', () => {
    mockUseGame.mockReturnValue({ game: makeGame(), isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });

  it('shows LOCKED status for locked game', () => {
    const game = makeGame({ lockoutTimestampMs: NOW - 1_000, revealTimestampMs: NOW + 60_000 });
    mockUseGame.mockReturnValue({ game, isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    expect(screen.getByText('LOCKED')).toBeInTheDocument();
  });

  it('shows entry form when wallet connected and game open', () => {
    mockUseGame.mockReturnValue({ game: makeGame(), isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    expect(screen.getByRole('button', { name: /ENTER POT/i })).toBeInTheDocument();
  });

  it('shows "Connect your wallet to enter" when not connected', () => {
    mockUseCurrentAccount.mockReturnValue(null);
    mockUseGame.mockReturnValue({ game: makeGame(), isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument();
  });

  it('shows "Entries closed" message for locked game with wallet', () => {
    const game = makeGame({ lockoutTimestampMs: NOW - 1_000, revealTimestampMs: NOW + 60_000 });
    mockUseGame.mockReturnValue({ game, isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    expect(screen.getByText(/Entries closed/i)).toBeInTheDocument();
  });

  it('renders prize preview section', () => {
    mockUseGame.mockReturnValue({ game: makeGame(), isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    expect(screen.getByText(/Prize Preview/i)).toBeInTheDocument();
  });

  it('ENTER POT button is disabled when amount is empty', () => {
    mockUseGame.mockReturnValue({ game: makeGame(), isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    const btn = screen.getByRole('button', { name: /ENTER POT/i });
    expect(btn).toBeDisabled();
  });

  it('shows minimum contribution from game data (17.20 IOTA)', () => {
    mockUseGame.mockReturnValue({ game: makeGame(), isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    expect(screen.getAllByText(/17\.20 IOTA/)[0]).toBeInTheDocument();
  });

  it('shows error message when amount < minimum', () => {
    mockUseGame.mockReturnValue({ game: makeGame(), isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    const input = screen.getByPlaceholderText(/17\.20/);
    fireEvent.change(input, { target: { value: '1' } });
    expect(screen.getByText(/Minimum entry is/i)).toBeInTheDocument();
  });

  it('prize preview shows correct player count for repeat contributor', () => {
    const game = makeGame({ players: [ADMIN_ADDRESS] });
    mockUseGame.mockReturnValue({ game, isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    // alreadyIn = true, so entryCount = 1 + 0 = 1
    expect(screen.getByText(/Prize Preview \(1 players\)/i)).toBeInTheDocument();
  });

  it('prize preview shows +1 player count for new contributor', () => {
    const game = makeGame({ players: ['0x' + 'a'.repeat(64)] }); // different address
    mockUseGame.mockReturnValue({ game, isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    // alreadyIn = false, so entryCount = 1 + 1 = 2
    expect(screen.getByText(/Prize Preview \(2 players\)/i)).toBeInTheDocument();
  });

  it('redirects to results for a revealed game (no OPEN badge)', () => {
    mockUseGame.mockReturnValue({ game: makeRevealedGame(), isLoading: false });
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    expect(screen.queryByText('OPEN')).not.toBeInTheDocument();
  });
});
