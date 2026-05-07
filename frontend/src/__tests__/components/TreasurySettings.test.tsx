import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TreasurySettings from '../../components/TreasurySettings';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, ADMIN_CAP_ID, PACKAGE_ID, GLOBAL_CONFIG_ID, PLAYER_A } from '../../test-utils/factories';

const mockSignAndExecute = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useSignAndExecuteTransaction: () => ({ mutate: mockSignAndExecute }),
  useCurrentAccount: () => ({ address: ADMIN_ADDRESS }),
  useIotaClientQuery: () => ({
    data: { data: [{ data: { objectId: ADMIN_CAP_ID } }] },
  }),
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
  RANDOM_OBJECT_ID: '0x8',
  CLOCK_OBJECT_ID: '0x6',
  MIN_GAME_DURATION_MS: 86_400_000,
  LOCKOUT_DURATION_MS: 600_000,
  HISTORY_THRESHOLD_MS: 259_200_000,
  PRIZE_PCTS: {},
  ACTIVE_NETWORK: 'testnet',
}));

describe('TreasurySettings', () => {
  it('renders Treasury Address heading', () => {
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });
    expect(screen.getAllByText(/Treasury Address/i)[0]).toBeInTheDocument();
  });

  it('shows current treasury address', () => {
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });
    expect(screen.getByText(ADMIN_ADDRESS)).toBeInTheDocument();
  });

  it('shows "Loading..." when treasury is empty', () => {
    render(<TreasurySettings currentTreasury="" />, { wrapper: Wrapper });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('UPDATE TREASURY button is disabled when input is empty', () => {
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });
    const btn = screen.getByRole('button', { name: /UPDATE TREASURY/i });
    expect(btn).toBeDisabled();
  });

  it('shows invalid address error for malformed input', () => {
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: 'invalid-address' } });
    expect(screen.getByText(/Invalid IOTA address/i)).toBeInTheDocument();
  });

  it('enables button for valid IOTA address', () => {
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: PLAYER_A } });
    const btn = screen.getByRole('button', { name: /UPDATE TREASURY/i });
    expect(btn).not.toBeDisabled();
  });

  it('shows warning about redirecting future cuts', () => {
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });
    expect(screen.getByText(/redirects all future admin cuts/i)).toBeInTheDocument();
  });
});
