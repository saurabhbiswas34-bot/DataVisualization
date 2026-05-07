import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MinContributionUpdater from '../../components/MinContributionUpdater';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, ADMIN_CAP_ID, PACKAGE_ID, GLOBAL_CONFIG_ID } from '../../test-utils/factories';

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

describe('MinContributionUpdater', () => {
  it('renders Min Contribution heading', () => {
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    expect(screen.getByText(/Min Contribution/i)).toBeInTheDocument();
  });

  it('shows current on-chain minimum', () => {
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    expect(screen.getByText(/17\.2000 IOTA/)).toBeInTheDocument();
  });

  it('shows recommended value from live price', () => {
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    expect(screen.getByText(/Recommended for \$1\.00 USD/i)).toBeInTheDocument();
  });

  it('renders UPDATE ON-CHAIN button', () => {
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /UPDATE ON-CHAIN/i })).toBeInTheDocument();
  });

  it('shows "Sync to live" button', () => {
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    expect(screen.getByText(/Sync to live/i)).toBeInTheDocument();
  });

  it('live IOTA price is shown', () => {
    render(<MinContributionUpdater currentMinNanos={17_200_000_000n} />, { wrapper: Wrapper });
    expect(screen.getByText(/\$1\.0000 USD/)).toBeInTheDocument();
  });
});
