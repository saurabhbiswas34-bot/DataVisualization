import { vi } from 'vitest';
import { ADMIN_ADDRESS, PACKAGE_ID, GLOBAL_CONFIG_ID } from './factories';

export const mockAccount = {
  address: ADMIN_ADDRESS,
  publicKey: new Uint8Array(32),
  chains: ['iota:testnet'] as const,
};

export const mockSignAndExecute = vi.fn();
export const mockUseCurrentAccount = vi.fn(() => mockAccount);
export const mockUseSignAndExecuteTransaction = vi.fn(() => ({
  mutate: mockSignAndExecute,
  isPending: false,
}));

export const mockIotaClientQueryFn = vi.fn(() => ({
  data: undefined,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const mockUseNetworkVariable = vi.fn((key: string) => {
  const vars: Record<string, string> = {
    packageId: PACKAGE_ID,
    globalConfigId: GLOBAL_CONFIG_ID,
    adminAddress: ADMIN_ADDRESS,
  };
  return vars[key] ?? '';
});

export const mockUseIotaClient = vi.fn(() => ({
  queryEvents: vi.fn().mockResolvedValue({ data: [] }),
  getObject: vi.fn().mockResolvedValue({ data: null }),
}));

export const mockConnectButton = () => null;
