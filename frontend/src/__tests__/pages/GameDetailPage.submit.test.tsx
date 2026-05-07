/**
 * GameDetailPage — add-to-pot form submission scenarios.
 * Uses fireEvent.submit on the <form> element which is more reliable
 * than clicking the submit button in happy-dom.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import GameDetailPage from '../../pages/GameDetailPage';
import { renderWithProviders } from '../../test-utils/wrappers';
import { makeGame, ADMIN_ADDRESS, GAME_OBJECT_ID, NOW } from '../../test-utils/factories';

const mockUseGame = vi.fn();
const mockUseCurrentAccount = vi.fn();
const mockSignAndExecute = vi.fn();

vi.mock('../../hooks/useGame', () => ({ useGame: () => mockUseGame() }));
vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 2.0, minEntryIOTA: 0.5, isLoading: false }),
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

describe('GameDetailPage — form submission', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    mockUseCurrentAccount.mockReturnValue({ address: ADMIN_ADDRESS });
    mockUseGame.mockReturnValue({ game: makeGame(), isLoading: false });
    mockSignAndExecute.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls signAndExecute when form submitted with valid amount', async () => {
    mockSignAndExecute.mockImplementation(() => {}); // don't call callbacks
    const { container } = renderWithProviders(<GameDetailPage />, {
      initialRoute: `/game/${GAME_OBJECT_ID}`,
    });

    fireEvent.change(screen.getByPlaceholderText(/17\.20/), { target: { value: '20' } });
    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    expect(mockSignAndExecute).toHaveBeenCalledTimes(1);
    const [txArg] = mockSignAndExecute.mock.calls[0];
    expect(txArg).toHaveProperty('transaction');
  });

  it('shows success banner after tx onSuccess fires', async () => {
    mockSignAndExecute.mockImplementation((_tx: unknown, cbs: any) => cbs.onSuccess({}));
    const { container } = renderWithProviders(<GameDetailPage />, {
      initialRoute: `/game/${GAME_OBJECT_ID}`,
    });

    fireEvent.change(screen.getByPlaceholderText(/17\.20/), { target: { value: '20' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Entry confirmed/i)).toBeInTheDocument();
    });
  });

  it('clears amount field after successful tx', async () => {
    mockSignAndExecute.mockImplementation((_tx: unknown, cbs: any) => cbs.onSuccess({}));
    const { container } = renderWithProviders(<GameDetailPage />, {
      initialRoute: `/game/${GAME_OBJECT_ID}`,
    });

    const input = screen.getByPlaceholderText(/17\.20/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(input.value).toBe(''));
  });

  it('shows error banner when tx onError fires', async () => {
    mockSignAndExecute.mockImplementation((_tx: unknown, cbs: any) =>
      cbs.onError(new Error('insufficient balance'))
    );
    const { container } = renderWithProviders(<GameDetailPage />, {
      initialRoute: `/game/${GAME_OBJECT_ID}`,
    });

    fireEvent.change(screen.getByPlaceholderText(/17\.20/), { target: { value: '20' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Transaction failed: insufficient balance/i)).toBeInTheDocument();
    });
  });

  it('does NOT call signAndExecute when amount is below minimum', () => {
    const { container } = renderWithProviders(<GameDetailPage />, {
      initialRoute: `/game/${GAME_OBJECT_ID}`,
    });
    fireEvent.change(screen.getByPlaceholderText(/17\.20/), { target: { value: '1' } });
    fireEvent.submit(container.querySelector('form')!);
    expect(mockSignAndExecute).not.toHaveBeenCalled();
  });

  it('does NOT call signAndExecute when amount is empty', () => {
    const { container } = renderWithProviders(<GameDetailPage />, {
      initialRoute: `/game/${GAME_OBJECT_ID}`,
    });
    fireEvent.submit(container.querySelector('form')!);
    expect(mockSignAndExecute).not.toHaveBeenCalled();
  });

  it('shows USD equivalent when amount is typed', () => {
    renderWithProviders(<GameDetailPage />, { initialRoute: `/game/${GAME_OBJECT_ID}` });
    fireEvent.change(screen.getByPlaceholderText(/17\.20/), { target: { value: '20' } });
    // 20 IOTA × $2.00 = $40.00 USD
    expect(screen.getByText(/≈ \$40\.00 USD/i)).toBeInTheDocument();
  });
});
