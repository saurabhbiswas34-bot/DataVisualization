import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CreateGameForm from '../../components/CreateGameForm';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, ADMIN_CAP_ID, PACKAGE_ID, GLOBAL_CONFIG_ID } from '../../test-utils/factories';

const mockIotaClientQuery = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useSignAndExecuteTransaction: () => ({ mutate: vi.fn() }),
  useCurrentAccount: () => ({ address: ADMIN_ADDRESS }),
  useIotaClientQuery: (_method: string, _params: unknown, _opts: unknown) =>
    mockIotaClientQuery(),
}));

vi.mock('../../hooks/useIsAdmin', () => ({
  useIsAdmin: () => ({ isAdmin: true, adminAddress: ADMIN_ADDRESS }),
}));

vi.mock('../../networkConfig', () => ({
  useNetworkVariable: (key: string) => {
    if (key === 'packageId') return PACKAGE_ID;
    if (key === 'globalConfigId') return GLOBAL_CONFIG_ID;
    return '';
  },
  MIN_GAME_DURATION_MS: 86_400_000,
  LOCKOUT_DURATION_MS: 600_000,
  RANDOM_OBJECT_ID: '0x8',
  CLOCK_OBJECT_ID: '0x6',
  HISTORY_THRESHOLD_MS: 259_200_000,
  PRIZE_PCTS: {},
  ACTIVE_NETWORK: 'testnet',
}));

describe('CreateGameForm', () => {
  it('renders the "Create New Pot" heading', () => {
    mockIotaClientQuery.mockReturnValue({
      data: { data: [{ data: { objectId: ADMIN_CAP_ID } }] },
    });
    render(<CreateGameForm />, { wrapper: Wrapper });
    expect(screen.getByText(/Create New Pot/i)).toBeInTheDocument();
  });

  it('renders the "CREATE POT" submit button', () => {
    mockIotaClientQuery.mockReturnValue({
      data: { data: [{ data: { objectId: ADMIN_CAP_ID } }] },
    });
    render(<CreateGameForm />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /CREATE POT/i })).toBeInTheDocument();
  });

  it('submit button is disabled when no date selected', () => {
    mockIotaClientQuery.mockReturnValue({
      data: { data: [{ data: { objectId: ADMIN_CAP_ID } }] },
    });
    render(<CreateGameForm />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /CREATE POT/i });
    expect(btn).toBeDisabled();
  });

  it('shows prize distribution breakdown with all three tiers', () => {
    mockIotaClientQuery.mockReturnValue({
      data: { data: [{ data: { objectId: ADMIN_CAP_ID } }] },
    });
    render(<CreateGameForm />, { wrapper: Wrapper });
    expect(screen.getByText(/Prize Distribution/i)).toBeInTheDocument();
    // All three player-count tiers should be visible
    expect(screen.getByText('1 player')).toBeInTheDocument();
    expect(screen.getByText('2 players')).toBeInTheDocument();
    expect(screen.getByText('3+ players')).toBeInTheDocument();
    // 1-player: 90% to winner
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('shows Reveal Date & Time label', () => {
    mockIotaClientQuery.mockReturnValue({
      data: { data: [{ data: { objectId: ADMIN_CAP_ID } }] },
    });
    render(<CreateGameForm />, { wrapper: Wrapper });
    expect(screen.getByText(/Reveal Date/i)).toBeInTheDocument();
  });

  it('shows "AdminCap not found" warning when no adminCap returned', () => {
    mockIotaClientQuery.mockReturnValue({
      data: { data: [] }, // no AdminCap found
    });
    render(<CreateGameForm />, { wrapper: Wrapper });
    expect(screen.getByText(/AdminCap not found/i)).toBeInTheDocument();
  });
});
