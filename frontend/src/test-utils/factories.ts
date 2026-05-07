import type { ParsedGame } from '../types';

export const ADMIN_ADDRESS = '0xe21283aba70e849dbd223d40e3fb6e71899af96afec60aa2ea09578aabfe6d38';
export const PLAYER_A = '0x' + 'a'.repeat(64);
export const PLAYER_B = '0x' + 'b'.repeat(64);
export const PLAYER_C = '0x' + 'c'.repeat(64);
export const GAME_OBJECT_ID = '0x' + 'd'.repeat(64);
export const PACKAGE_ID = '0xf936757d547629b4c8c22a9a36c823de7799c6496a2910a1c11e3af8b0ee171a';
export const GLOBAL_CONFIG_ID = '0x62fe4b0e6d1a745281632d08a810182b839bb69e45bf94bba108de04fc2878e3';
export const ADMIN_CAP_ID = '0x' + 'e'.repeat(64);

// Normalized system object IDs (IOTA SDK pads to 64 hex chars)
export const CLOCK_OBJECT_ID_NORM = '0x0000000000000000000000000000000000000000000000000000000000000006';
export const RANDOM_OBJECT_ID_NORM = '0x0000000000000000000000000000000000000000000000000000000000000008';

export const NOW = 1_700_000_000_000;
export const REVEAL_MS = NOW + 2 * 86_400_000; // 2 days from now
export const LOCKOUT_MS = REVEAL_MS - 600_000;

export function makeGame(overrides: Partial<ParsedGame> = {}): ParsedGame {
  return {
    objectId: GAME_OBJECT_ID,
    gameId: 1,
    potNanos: 100_000_000_000n, // 100 IOTA
    potIOTA: 100,
    minContributionNanos: 17_200_000_000n, // 17.2 IOTA
    players: [],
    createdAtMs: NOW - 86_400_000,
    revealTimestampMs: REVEAL_MS,
    lockoutTimestampMs: LOCKOUT_MS,
    isActive: true,
    revealedAtMs: null,
    winner1: null,
    winner2: null,
    winner3: null,
    prize1Nanos: 0n,
    prize2Nanos: 0n,
    prize3Nanos: 0n,
    treasuryCutNanos: 0n,
    ...overrides,
  };
}

export function makeRevealedGame(overrides: Partial<ParsedGame> = {}): ParsedGame {
  return makeGame({
    isActive: false,
    revealedAtMs: NOW - 3_600_000, // revealed 1 hour ago
    players: [PLAYER_A, PLAYER_B, PLAYER_C],
    winner1: PLAYER_A,
    winner2: PLAYER_B,
    winner3: PLAYER_C,
    prize1Nanos: 50_000_000_000n,
    prize2Nanos: 30_000_000_000n,
    prize3Nanos: 10_000_000_000n,
    treasuryCutNanos: 10_000_000_000n,
    ...overrides,
  });
}

export function makeHistoryGame(overrides: Partial<ParsedGame> = {}): ParsedGame {
  return makeRevealedGame({
    revealedAtMs: NOW - 4 * 86_400_000, // 4 days ago → history
    ...overrides,
  });
}
