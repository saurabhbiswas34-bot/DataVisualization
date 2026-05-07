import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WinnersBoard from '../../components/WinnersBoard';
import { makeRevealedGame, PLAYER_A, PLAYER_B, PLAYER_C } from '../../test-utils/factories';
import { Wrapper } from '../../test-utils/wrappers';

vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 1.0, minEntryNanos: 0n, minEntryIOTA: 0, isLoading: false, error: null, lastUpdated: new Date() }),
}));

describe('WinnersBoard', () => {
  it('renders "Winners" heading', () => {
    render(<WinnersBoard game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText(/Winners/i)).toBeInTheDocument();
  });

  it('shows three winner sections for a 3-player revealed game', () => {
    render(<WinnersBoard game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('1st Place')).toBeInTheDocument();
    expect(screen.getByText('2nd Place')).toBeInTheDocument();
    expect(screen.getByText('3rd Place')).toBeInTheDocument();
  });

  it('shows only 1st place winner for a 1-player game', () => {
    const game = makeRevealedGame({ winner2: null, winner3: null, prize2Nanos: 0n, prize3Nanos: 0n });
    render(<WinnersBoard game={game} />, { wrapper: Wrapper });
    expect(screen.getByText('1st Place')).toBeInTheDocument();
    expect(screen.queryByText('2nd Place')).not.toBeInTheDocument();
  });

  it('shows truncated winner addresses', () => {
    render(<WinnersBoard game={makeRevealedGame()} />, { wrapper: Wrapper });
    // Addresses are formatted; check for at least one formatted address pattern
    const monos = document.querySelectorAll('.font-mono');
    expect(monos.length).toBeGreaterThan(0);
  });

  it('shows the treasury cut when non-zero', () => {
    render(<WinnersBoard game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText(/Admin Treasury/i)).toBeInTheDocument();
  });

  it('does not show treasury section when treasuryCutNanos is 0', () => {
    const game = makeRevealedGame({ treasuryCutNanos: 0n });
    render(<WinnersBoard game={game} />, { wrapper: Wrapper });
    expect(screen.queryByText(/Admin Treasury/i)).not.toBeInTheDocument();
  });

  it('shows "Prize Sent" confirmation badges', () => {
    render(<WinnersBoard game={makeRevealedGame()} />, { wrapper: Wrapper });
    const badges = screen.getAllByText('✓ Prize Sent');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('displays IOTA prize amounts', () => {
    render(<WinnersBoard game={makeRevealedGame()} />, { wrapper: Wrapper });
    // 50 IOTA for 1st place
    expect(screen.getByText(/50\.0000 IOTA/)).toBeInTheDocument();
  });
});
