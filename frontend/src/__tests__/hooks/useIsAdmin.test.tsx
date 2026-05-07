import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, PLAYER_A } from '../../test-utils/factories';

const mockUseCurrentAccount = vi.fn();
const mockUseIotaClientQuery = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useCurrentAccount: () => mockUseCurrentAccount(),
  useIotaClientQuery: (_method: string, _params: unknown, _opts: unknown) =>
    mockUseIotaClientQuery(),
}));

vi.mock('../../networkConfig', () => ({
  useNetworkVariable: (key: string) => {
    if (key === 'globalConfigId') return '0x' + 'f'.repeat(64);
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

describe('useIsAdmin', () => {
  beforeEach(() => {
    mockUseIotaClientQuery.mockReturnValue({
      data: {
        data: {
          content: {
            fields: {
              admin_address: ADMIN_ADDRESS,
            },
          },
        },
      },
    });
  });

  it('returns isAdmin=true when connected wallet matches admin address', () => {
    mockUseCurrentAccount.mockReturnValue({ address: ADMIN_ADDRESS });
    const { result } = renderHook(() => useIsAdmin(), {
      wrapper: Wrapper,
    });
    expect(result.current.isAdmin).toBe(true);
  });

  it('returns isAdmin=false when connected wallet does not match', () => {
    mockUseCurrentAccount.mockReturnValue({ address: PLAYER_A });
    const { result } = renderHook(() => useIsAdmin(), {
      wrapper: Wrapper,
    });
    expect(result.current.isAdmin).toBe(false);
  });

  it('returns isAdmin=false when no wallet connected', () => {
    mockUseCurrentAccount.mockReturnValue(null);
    const { result } = renderHook(() => useIsAdmin(), {
      wrapper: Wrapper,
    });
    expect(result.current.isAdmin).toBe(false);
  });

  it('returns the adminAddress from the config', () => {
    mockUseCurrentAccount.mockReturnValue({ address: ADMIN_ADDRESS });
    const { result } = renderHook(() => useIsAdmin(), {
      wrapper: Wrapper,
    });
    expect(result.current.adminAddress).toBe(ADMIN_ADDRESS);
  });

  it('returns empty adminAddress when config data is missing', () => {
    mockUseCurrentAccount.mockReturnValue({ address: ADMIN_ADDRESS });
    mockUseIotaClientQuery.mockReturnValue({ data: null });
    const { result } = renderHook(() => useIsAdmin(), {
      wrapper: Wrapper,
    });
    expect(result.current.adminAddress).toBe('');
    expect(result.current.isAdmin).toBe(false);
  });

  it('is case-insensitive for address comparison', () => {
    mockUseCurrentAccount.mockReturnValue({ address: ADMIN_ADDRESS.toUpperCase() });
    const { result } = renderHook(() => useIsAdmin(), {
      wrapper: Wrapper,
    });
    expect(result.current.isAdmin).toBe(true);
  });
});
