import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AllEntriesTable from '../../components/AllEntriesTable';
import { makeRevealedGame, makeGame, PLAYER_A, PLAYER_B } from '../../test-utils/factories';
import { Wrapper } from '../../test-utils/wrappers';

describe('AllEntriesTable', () => {
  it('renders the table heading with game ID', () => {
    render(<AllEntriesTable game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText(/All Entries — Pot #1/i)).toBeInTheDocument();
  });

  it('shows player count in subtitle', () => {
    render(<AllEntriesTable game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText(/3 unique players/i)).toBeInTheDocument();
  });

  it('renders a row for each player', () => {
    const game = makeRevealedGame({ players: [PLAYER_A, PLAYER_B] });
    render(<AllEntriesTable game={game} />, { wrapper: Wrapper });
    const rows = screen.getAllByText(/🎫 1/);
    expect(rows.length).toBe(2);
  });

  it('marks 1st place winner with trophy emoji', () => {
    render(<AllEntriesTable game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('🥇 1st')).toBeInTheDocument();
  });

  it('marks 2nd place winner', () => {
    render(<AllEntriesTable game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('🥈 2nd')).toBeInTheDocument();
  });

  it('marks 3rd place winner', () => {
    render(<AllEntriesTable game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('🥉 3rd')).toBeInTheDocument();
  });

  it('shows dash for non-winners', () => {
    const game = makeGame({ players: [PLAYER_A, PLAYER_B], winner1: PLAYER_A });
    render(<AllEntriesTable game={game} />, { wrapper: Wrapper });
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders table column headers', () => {
    render(<AllEntriesTable game={makeRevealedGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Wallet Address')).toBeInTheDocument();
    expect(screen.getByText('Draw Ticket')).toBeInTheDocument();
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
