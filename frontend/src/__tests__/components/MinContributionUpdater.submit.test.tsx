/**
 * Additional tests for MinContributionUpdater submission paths.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MinContributionUpdater from '../../components/MinContributionUpdater';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, ADMIN_CAP_ID, PACKAGE_ID, GLOBAL_CONFIG_ID } from '../../test-utils/factories';

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

vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({
    priceUSD: 1.0,
    minEntryNanos: 1_000_000_000n,
    minEntryIOTA: 1.0,
    isLoading: false,
    error: null,
    lastUpdated: new Date(),
  }),
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

describe('MinContributionUpdater — form submission', () => {
  beforeEach(() => {
    mockMutate.mockReset();
  });

  it('calls signAndExecute on submit', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) => cbs?.onSuccess?.());
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /UPDATE ON-CHAIN/i }));
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('shows success message after update', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) => cbs?.onSuccess?.());
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /UPDATE ON-CHAIN/i }));
    expect(screen.getByText(/Minimum contribution updated/i)).toBeInTheDocument();
  });

  it('shows error message on tx failure', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) =>
      cbs?.onError?.(new Error('tx rejected'))
    );
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /UPDATE ON-CHAIN/i }));
    expect(screen.getByText(/Failed: tx rejected/i)).toBeInTheDocument();
  });

  it('syncs to live price when "Sync to live" is clicked', () => {
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    const syncBtn = screen.getByText(/Sync to live/i);
    fireEvent.click(syncBtn);
    const input = screen.getByPlaceholderText(/1000000000/);
    expect((input as HTMLInputElement).value).toBe('1000000000');
  });

  it('uses custom nanos when provided', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) => cbs?.onSuccess?.());
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/1000000000/);
    fireEvent.change(input, { target: { value: '5000000000' } });
    fireEvent.click(screen.getByRole('button', { name: /UPDATE ON-CHAIN/i }));
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });
});
