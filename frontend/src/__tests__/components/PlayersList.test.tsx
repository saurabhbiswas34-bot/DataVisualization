import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayersList from '../../components/PlayersList';
import { makeGame, PLAYER_A, PLAYER_B } from '../../test-utils/factories';
import { Wrapper } from '../../test-utils/wrappers';

vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 1.0, minEntryNanos: 0n, minEntryIOTA: 0, isLoading: false, error: null, lastUpdated: new Date() }),
}));

describe('PlayersList', () => {
  it('shows empty state when no players', () => {
    render(<PlayersList game={makeGame({ players: [] })} />, { wrapper: Wrapper });
    expect(screen.getByText(/No players yet/i)).toBeInTheDocument();
  });

  it('shows player count in heading', () => {
    const game = makeGame({ players: [PLAYER_A, PLAYER_B] });
    render(<PlayersList game={game} />, { wrapper: Wrapper });
    expect(screen.getByText(/Players \(2 unique\)/i)).toBeInTheDocument();
  });

  it('renders a row for each player', () => {
    const game = makeGame({ players: [PLAYER_A, PLAYER_B] });
    render(<PlayersList game={game} />, { wrapper: Wrapper });
    const tickets = screen.getAllByText(/🎫 1/);
    expect(tickets.length).toBe(2);
  });

  it('shows address columns', () => {
    const game = makeGame({ players: [PLAYER_A] });
    render(<PlayersList game={game} />, { wrapper: Wrapper });
    expect(screen.getByText('Address')).toBeInTheDocument();
  });

  it('shows ticket column header', () => {
    const game = makeGame({ players: [PLAYER_A] });
    render(<PlayersList game={game} />, { wrapper: Wrapper });
    expect(screen.getByText('Ticket')).toBeInTheDocument();
  });
});
