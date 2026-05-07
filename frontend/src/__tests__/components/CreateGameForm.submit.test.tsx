/**
 * Additional tests for CreateGameForm submission paths (covers success/error callbacks).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateGameForm from '../../components/CreateGameForm';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, ADMIN_CAP_ID, PACKAGE_ID, GLOBAL_CONFIG_ID } from '../../test-utils/factories';
import { MIN_GAME_DURATION_MS } from '../../networkConfig';

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

function getFutureDateStr(offsetMs = 2 * 86_400_000 + 60_000) {
  const d = new Date(Date.now() + offsetMs);
  return d.toISOString().slice(0, 16);
}

function getDateInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="datetime-local"]') as HTMLInputElement;
}

describe('CreateGameForm — form submission', () => {
  beforeEach(() => {
    mockMutate.mockReset();
  });

  it('calls signAndExecute when valid date is selected and submitted', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) => cbs?.onSuccess?.({ digest: '0xabc' }));
    const { container } = render(<CreateGameForm />, { wrapper: Wrapper });
    fireEvent.change(getDateInput(container), { target: { value: getFutureDateStr() } });
    fireEvent.click(screen.getByRole('button', { name: /CREATE POT/i }));
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('shows success message after pot creation', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) => cbs?.onSuccess?.({ digest: '0xabc' }));
    const { container } = render(<CreateGameForm />, { wrapper: Wrapper });
    fireEvent.change(getDateInput(container), { target: { value: getFutureDateStr() } });
    fireEvent.click(screen.getByRole('button', { name: /CREATE POT/i }));
    expect(screen.getByText(/Pot created/i)).toBeInTheDocument();
  });

  it('shows error message on tx failure', () => {
    mockMutate.mockImplementation((_tx: unknown, cbs: any) =>
      cbs?.onError?.(new Error('insufficient gas'))
    );
    const { container } = render(<CreateGameForm />, { wrapper: Wrapper });
    fireEvent.change(getDateInput(container), { target: { value: getFutureDateStr() } });
    fireEvent.click(screen.getByRole('button', { name: /CREATE POT/i }));
    expect(screen.getByText(/Failed: insufficient gas/i)).toBeInTheDocument();
  });

  it('shows "Must be more than 24 hours" for a date too close', () => {
    const { container } = render(<CreateGameForm />, { wrapper: Wrapper });
    const tooSoon = new Date(Date.now() + 3_600_000).toISOString().slice(0, 16);
    fireEvent.change(getDateInput(container), { target: { value: tooSoon } });
    expect(screen.getByText(/Must be more than 24 hours/i)).toBeInTheDocument();
  });

  it('shows lockout time preview for valid date', () => {
    const { container } = render(<CreateGameForm />, { wrapper: Wrapper });
    fireEvent.change(getDateInput(container), { target: { value: getFutureDateStr() } });
    expect(screen.getByText(/Entries close at/i)).toBeInTheDocument();
  });
});
