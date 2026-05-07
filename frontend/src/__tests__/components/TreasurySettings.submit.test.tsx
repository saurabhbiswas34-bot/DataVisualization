/**
 * Additional tests for TreasurySettings submission paths.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TreasurySettings from '../../components/TreasurySettings';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, ADMIN_CAP_ID, PACKAGE_ID, GLOBAL_CONFIG_ID, PLAYER_A } from '../../test-utils/factories';

const mockMutate = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useSignAndExecuteTransaction: () => ({ mutate: mockMutate }),
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

describe('TreasurySettings — form submission', () => {
  beforeEach(() => {
    mockMutate.mockReset();
  });

  it('calls signAndExecute with valid IOTA address', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) => cbs?.onSuccess?.());
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: PLAYER_A } });
    fireEvent.click(screen.getByRole('button', { name: /UPDATE TREASURY/i }));
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('shows success message after update', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) => cbs?.onSuccess?.());
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: PLAYER_A } });
    fireEvent.click(screen.getByRole('button', { name: /UPDATE TREASURY/i }));
    expect(screen.getByText(/Treasury address updated/i)).toBeInTheDocument();
  });

  it('shows error message on tx failure', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) =>
      cbs?.onError?.(new Error('out of gas'))
    );
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: PLAYER_A } });
    fireEvent.click(screen.getByRole('button', { name: /UPDATE TREASURY/i }));
    expect(screen.getByText(/Failed: out of gas/i)).toBeInTheDocument();
  });
});
