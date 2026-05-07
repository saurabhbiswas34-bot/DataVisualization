import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PotCard from '../../components/PotCard';
import { makeGame, makeRevealedGame, makeHistoryGame, NOW } from '../../test-utils/factories';
import { Wrapper } from '../../test-utils/wrappers';

vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 1.0, minEntryNanos: 0n, minEntryIOTA: 0, isLoading: false, error: null, lastUpdated: new Date() }),
}));

describe('PotCard', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the pot number', () => {
    render(<PotCard game={makeGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('Pot #1')).toBeInTheDocument();
  });

  it('shows OPEN badge for an open game', () => {
    render(<PotCard game={makeGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });

  it('shows LOCKED badge for a locked game', () => {
    const game = makeGame({ lockoutTimestampMs: NOW - 1_000, revealTimestampMs: NOW + 60_000 });
    render(<PotCard game={game} />, { wrapper: Wrapper });
    expect(screen.getByText('LOCKED')).toBeInTheDocument();
  });

  it('shows REVEALED badge for a revealed game', () => {
    render(<PotCard game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('REVEALED')).toBeInTheDocument();
  });

  it('shows COMPLETED badge for a history game', () => {
    render(<PotCard game={makeHistoryGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('shows pot IOTA amount', () => {
    render(<PotCard game={makeGame()} />, { wrapper: Wrapper });
    expect(screen.getByText(/100\.00 IOTA/)).toBeInTheDocument();
  });

  it('shows player count', () => {
    const game = makeGame({ players: ['0xaaa'] });
    render(<PotCard game={game} />, { wrapper: Wrapper });
    expect(screen.getByText(/1 unique player/)).toBeInTheDocument();
  });

  it('"Enter Pot →" link for open games', () => {
    render(<PotCard game={makeGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('Enter Pot →')).toBeInTheDocument();
  });

  it('"View Results →" link for revealed/history games', () => {
    render(<PotCard game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('View Results →')).toBeInTheDocument();
  });

  it('"Locked" button for locked games', () => {
    const game = makeGame({ lockoutTimestampMs: NOW - 1_000, revealTimestampMs: NOW + 60_000 });
    render(<PotCard game={game} />, { wrapper: Wrapper });
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('shows countdown timer text for active games', () => {
    render(<PotCard game={makeGame()} />, { wrapper: Wrapper });
    // Countdown is in DD:HH:MM:SS format
    const monos = document.querySelectorAll('.font-mono');
    expect(monos.length).toBeGreaterThan(0);
  });
});
