import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoryCard from '../../components/HistoryCard';
import { makeHistoryGame, PLAYER_A } from '../../test-utils/factories';
import { Wrapper } from '../../test-utils/wrappers';

vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 1.0, isLoading: false }),
}));

describe('HistoryCard', () => {
  it('renders game number', () => {
    render(<HistoryCard game={makeHistoryGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('shows "View Details →" link', () => {
    render(<HistoryCard game={makeHistoryGame()} />, { wrapper: Wrapper });
    expect(screen.getByText('View Details →')).toBeInTheDocument();
  });

  it('shows pot IOTA amount', () => {
    render(<HistoryCard game={makeHistoryGame()} />, { wrapper: Wrapper });
    expect(screen.getByText(/100\.00 IOTA/)).toBeInTheDocument();
  });

  it('shows player count', () => {
    render(<HistoryCard game={makeHistoryGame()} />, { wrapper: Wrapper });
    expect(screen.getByText(/3 players/)).toBeInTheDocument();
  });

  it('shows 1st place winner address', () => {
    render(<HistoryCard game={makeHistoryGame({ winner1: PLAYER_A })} />, { wrapper: Wrapper });
    expect(screen.getByText(/🥇/)).toBeInTheDocument();
  });

  it('shows dash when no reveal date', () => {
    render(<HistoryCard game={makeHistoryGame({ revealedAtMs: null })} />, { wrapper: Wrapper });
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
