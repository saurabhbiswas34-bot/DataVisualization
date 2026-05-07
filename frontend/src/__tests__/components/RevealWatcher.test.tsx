import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RevealWatcher from '../../components/RevealWatcher';
import { Wrapper } from '../../test-utils/wrappers';
import { makeGame, NOW } from '../../test-utils/factories';

vi.mock('../../hooks/useActiveGames', () => ({
  useActiveGames: vi.fn(),
}));

vi.mock('../../hooks/useIsAdmin', () => ({
  useIsAdmin: vi.fn(),
}));

vi.mock('../../hooks/useAutoReveal', () => ({
  useAutoReveal: vi.fn(),
}));

import { useActiveGames } from '../../hooks/useActiveGames';
import { useIsAdmin } from '../../hooks/useIsAdmin';

describe('RevealWatcher', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows "No active games" when list is empty', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: false, error: null, refetch: vi.fn() });
    vi.mocked(useIsAdmin).mockReturnValue({ isAdmin: false, adminAddress: '', currentAddress: '' });
    render(<RevealWatcher />, { wrapper: Wrapper });
    expect(screen.getByText(/No active games/i)).toBeInTheDocument();
  });

  it('shows ACTIVE indicator when admin is connected', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: false, error: null, refetch: vi.fn() });
    vi.mocked(useIsAdmin).mockReturnValue({ isAdmin: true, adminAddress: '0x1', currentAddress: '0x1' });
    render(<RevealWatcher />, { wrapper: Wrapper });
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('shows "Admin wallet not connected" when not admin', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: false, error: null, refetch: vi.fn() });
    vi.mocked(useIsAdmin).mockReturnValue({ isAdmin: false, adminAddress: '', currentAddress: '' });
    render(<RevealWatcher />, { wrapper: Wrapper });
    expect(screen.getByText(/Admin wallet not connected/i)).toBeInTheDocument();
  });

  it('renders active game rows', () => {
    const game = makeGame({ revealTimestampMs: NOW + 3_600_000 });
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [game], allGames: [game], isLoading: false, error: null, refetch: vi.fn() });
    vi.mocked(useIsAdmin).mockReturnValue({ isAdmin: true, adminAddress: '0x1', currentAddress: '0x1' });
    render(<RevealWatcher />, { wrapper: Wrapper });
    expect(screen.getByText(/Pot #1/)).toBeInTheDocument();
  });

  it('shows "⚡ NOW" for games ready to reveal', () => {
    const game = makeGame({ revealTimestampMs: NOW - 1_000 });
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [game], allGames: [game], isLoading: false, error: null, refetch: vi.fn() });
    vi.mocked(useIsAdmin).mockReturnValue({ isAdmin: true, adminAddress: '0x1', currentAddress: '0x1' });
    render(<RevealWatcher />, { wrapper: Wrapper });
    expect(screen.getByText('⚡ NOW')).toBeInTheDocument();
  });

  it('renders "Auto-Reveal Watcher" heading', () => {
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [], allGames: [], isLoading: false, error: null, refetch: vi.fn() });
    vi.mocked(useIsAdmin).mockReturnValue({ isAdmin: false, adminAddress: '', currentAddress: '' });
    render(<RevealWatcher />, { wrapper: Wrapper });
    expect(screen.getByText(/Auto-Reveal Watcher/i)).toBeInTheDocument();
  });
});
