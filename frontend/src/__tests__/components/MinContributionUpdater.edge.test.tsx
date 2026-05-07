/**
 * MinContributionUpdater edge cases:
 * - Zero customNanos silent no-op guard
 * - Pending UI
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

describe('MinContributionUpdater — zero nanos guard', () => {
  beforeEach(() => mockMutate.mockReset());

  it('does NOT call signAndExecute when customNanos is 0', () => {
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });

    // Type "0" into the custom nanos field
    const input = screen.getByPlaceholderText(/1000000000/);
    fireEvent.change(input, { target: { value: '0' } });

    fireEvent.click(screen.getByRole('button', { name: /UPDATE ON-CHAIN/i }));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows "Updating..." pending state while tx in flight', () => {
    mockMutate.mockImplementation(() => {}); // never calls callbacks
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /UPDATE ON-CHAIN/i }));
    expect(screen.getByText(/Updating\.\.\./i)).toBeInTheDocument();
  });

  it('button is disabled during pending state', () => {
    mockMutate.mockImplementation(() => {});
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /UPDATE ON-CHAIN/i }));
    expect(screen.getByRole('button', { name: /UPDATE ON-CHAIN/i })).toBeDisabled();
  });
});
