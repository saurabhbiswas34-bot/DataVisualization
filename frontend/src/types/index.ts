export interface GameFields {
  id: { id: string };
  game_id: string;
  pot_balance: string; // NANOS as string
  min_contribution_nanos: string;
  entries: { contents: string[] }; // VecSet contents
  contributions: string; // Table object ID
  accumulated_entropy: number[];
  created_at_ms: string;
  reveal_timestamp_ms: string;
  lockout_timestamp_ms: string;
  is_active: boolean;
  revealed_at_ms: { fields?: { vec: string[] } } | null;
  winner_1: { fields?: { vec: string[] } } | null;
  winner_2: { fields?: { vec: string[] } } | null;
  winner_3: { fields?: { vec: string[] } } | null;
  prize_1_nanos: string;
  prize_2_nanos: string;
  prize_3_nanos: string;
  treasury_cut_nanos: string;
}

export interface ParsedGame {
  objectId: string;
  gameId: number;
  potNanos: bigint;
  potIOTA: number;
  minContributionNanos: bigint;
  players: string[]; // unique addresses
  createdAtMs: number;
  revealTimestampMs: number;
  lockoutTimestampMs: number;
  isActive: boolean;
  revealedAtMs: number | null;
  winner1: string | null;
  winner2: string | null;
  winner3: string | null;
  prize1Nanos: bigint;
  prize2Nanos: bigint;
  prize3Nanos: bigint;
  treasuryCutNanos: bigint;
}

export interface GlobalConfigFields {
  admin_address: string;
  treasury_address: string;
  game_counter: string;
  min_contribution_nanos: string;
}

export interface TicketFields {
  id: { id: string };
  game_id: string;
  player: string;
  amount_nanos: string;
  contributed_at_ms: string;
}

export interface PriceData {
  priceUSD: number;
  minEntryNanos: bigint;
  minEntryIOTA: number;
  lastUpdated: Date;
  isLoading: boolean;
  error: string | null;
}

export interface PrizeBreakdown {
  prize1IOTA: number;
  prize2IOTA: number;
  prize3IOTA: number;
  treasuryIOTA: number;
  prize1USD: number;
  prize2USD: number;
  prize3USD: number;
}

export type GameStatus = 'open' | 'locked' | 'revealed' | 'history';
