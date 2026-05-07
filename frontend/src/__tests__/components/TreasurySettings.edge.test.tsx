/**
 * TreasurySettings edge cases:
 * - Pending UI during tx
 * - Query disabled when packageId = 0xTODO
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TreasurySettings from '../../components/TreasurySettings';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, ADMIN_CAP_ID, PLAYER_A } from '../../test-utils/factories';

const mockMutate = vi.fn();
const mockIotaClientQuery = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useSignAndExecuteTransaction: () => ({ mutate: mockMutate }),
  useCurrentAccount: () => ({ address: ADMIN_ADDRESS }),
  useIotaClientQuery: () => mockIotaClientQuery(),
}));

vi.mock('../../hooks/useIsAdmin', () => ({
  useIsAdmin: () => ({ isAdmin: true, adminAddress: ADMIN_ADDRESS }),
}));

vi.mock('../../networkConfig', () => ({
  useNetworkVariable: (key: string) => {
    if (key === 'packageId') return '0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a';
    if (key === 'globalConfigId') return '0x62fe4b0e6d1a745281632d08a810182b839bb69e45bf94bba108de04fc2878e3';
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

describe('TreasurySettings — pending UI', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockIotaClientQuery.mockReturnValue({
      data: { data: [{ data: { objectId: ADMIN_CAP_ID } }] },
    });
  });

  it('shows "Updating..." status while tx is in flight', () => {
    mockMutate.mockImplementation(() => {}); // never calls callbacks
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });

    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: PLAYER_A } });
    fireEvent.click(screen.getByRole('button', { name: /UPDATE TREASURY/i }));

    expect(screen.getByText(/Updating\.\.\./i)).toBeInTheDocument();
  });

  it('button is disabled during pending tx', () => {
    mockMutate.mockImplementation(() => {});
    render(<TreasurySettings currentTreasury={ADMIN_ADDRESS} />, { wrapper: Wrapper });

    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: PLAYER_A } });
    fireEvent.click(screen.getByRole('button', { name: /UPDATE TREASURY/i }));

    expect(screen.getByRole('button', { name: /UPDATE TREASURY/i })).toBeDisabled();
  });
});
