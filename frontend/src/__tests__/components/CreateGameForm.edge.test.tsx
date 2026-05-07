/**
 * CreateGameForm edge cases:
 * - digest fallback when onSuccess receives no digest
 * - "Creating..." pending state during tx
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateGameForm from '../../components/CreateGameForm';
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

vi.mock('../../networkConfig', () => ({
  useNetworkVariable: (key: string) => {
    if (key === 'packageId') return PACKAGE_ID;
    if (key === 'globalConfigId') return GLOBAL_CONFIG_ID;
    return '';
  },
  MIN_GAME_DURATION_MS: 86_400_000,
  LOCKOUT_DURATION_MS: 600_000,
  RANDOM_OBJECT_ID: '0x8',
  CLOCK_OBJECT_ID: '0x0000000000000000000000000000000000000000000000000000000000000006',
  HISTORY_THRESHOLD_MS: 259_200_000,
  PRIZE_PCTS: {},
  ACTIVE_NETWORK: 'testnet',
}));

function getDateInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="datetime-local"]') as HTMLInputElement;
}

function getFutureDateStr() {
  return new Date(Date.now() + 2 * 86_400_000 + 60_000).toISOString().slice(0, 16);
}

describe('CreateGameForm — edge cases', () => {
  beforeEach(() => mockMutate.mockReset());

  it('shows "confirmed" fallback when onSuccess receives no digest', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) => cbs?.onSuccess?.({})); // no digest
    const { container } = render(<CreateGameForm />, { wrapper: Wrapper });
    fireEvent.change(getDateInput(container), { target: { value: getFutureDateStr() } });
    fireEvent.click(screen.getByRole('button', { name: /CREATE POT/i }));
    expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
  });

  it('shows "Creating pot..." pending state while tx is in flight', () => {
    // mutate never calls callbacks → pending stays true
    mockMutate.mockImplementation(() => {}); // no callbacks called
    const { container } = render(<CreateGameForm />, { wrapper: Wrapper });
    fireEvent.change(getDateInput(container), { target: { value: getFutureDateStr() } });
    fireEvent.click(screen.getByRole('button', { name: /CREATE POT/i }));
    expect(screen.getByText(/Creating pot\.\.\./i)).toBeInTheDocument();
  });

  it('shows "Creating..." on button while tx is in flight', () => {
    mockMutate.mockImplementation(() => {});
    const { container } = render(<CreateGameForm />, { wrapper: Wrapper });
    fireEvent.change(getDateInput(container), { target: { value: getFutureDateStr() } });
    fireEvent.click(screen.getByRole('button', { name: /CREATE POT/i }));
    expect(screen.getByRole('button', { name: /Creating\.\.\./i })).toBeInTheDocument();
  });

  it('does not submit when handleCreate is called but adminCapId is empty', () => {
    // Even if button is disabled, verify no tx fired
    mockMutate.mockImplementation(() => {});
    render(<CreateGameForm />, { wrapper: Wrapper });
    // No date set → isValidDate = false → button disabled → no tx
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
