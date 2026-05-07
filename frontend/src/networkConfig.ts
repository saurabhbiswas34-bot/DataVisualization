import { createNetworkConfig } from '@iota/dapp-kit';
import { getFullnodeUrl } from '@iota/iota-sdk/client';

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: import.meta.env.VITE_IOTA_FULLNODE_URL || getFullnodeUrl('testnet'),
      variables: {
        packageId: import.meta.env.VITE_PACKAGE_ID || '0xTODO',
        globalConfigId: import.meta.env.VITE_GLOBAL_CONFIG_ID || '0xTODO',
        adminAddress: import.meta.env.VITE_ADMIN_ADDRESS || '0xTODO',
      },
    },
    mainnet: {
      url: import.meta.env.VITE_IOTA_FULLNODE_URL || getFullnodeUrl('mainnet'),
      variables: {
        packageId: import.meta.env.VITE_PACKAGE_ID || '0xTODO',
        globalConfigId: import.meta.env.VITE_GLOBAL_CONFIG_ID || '0xTODO',
        adminAddress: import.meta.env.VITE_ADMIN_ADDRESS || '0xTODO',
      },
    },
  });

export { networkConfig, useNetworkVariable, useNetworkVariables };

// IOTA system singleton addresses — never change
export const RANDOM_OBJECT_ID = '0x8';
export const CLOCK_OBJECT_ID = '0x6';

// Timing constants (ms)
export const MIN_GAME_DURATION_MS = 86_400_000;
export const LOCKOUT_DURATION_MS = 600_000;
export const HISTORY_THRESHOLD_MS = 259_200_000; // 3 days

// Prize percentages
export const PRIZE_PCTS = {
  ONE_PLAYER: { p1: 90, treasury: 10 },
  TWO_PLAYERS: { p1: 50, p2: 40, treasury: 10 },
  THREE_PLUS: { p1: 50, p2: 30, p3: 10, treasury: 10 },
};

export type NetworkType = 'testnet' | 'mainnet';
export const ACTIVE_NETWORK: NetworkType =
  (import.meta.env.VITE_NETWORK as NetworkType) || 'testnet';
