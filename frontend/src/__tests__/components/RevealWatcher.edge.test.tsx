/**
 * RevealWatcher edge cases:
 * - IMMINENT suffix when 0 < remaining < 5 minutes
 * - No IMMINENT when remaining === 0 (shows ⚡ NOW instead)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RevealWatcher from '../../components/RevealWatcher';
import { Wrapper } from '../../test-utils/wrappers';
import { makeGame, NOW } from '../../test-utils/factories';

vi.mock('../../hooks/useActiveGames', () => ({ useActiveGames: vi.fn() }));
vi.mock('../../hooks/useIsAdmin', () => ({ useIsAdmin: vi.fn() }));
vi.mock('../../hooks/useAutoReveal', () => ({ useAutoReveal: vi.fn() }));

import { useActiveGames } from '../../hooks/useActiveGames';
import { useIsAdmin } from '../../hooks/useIsAdmin';

describe('RevealWatcher — IMMINENT suffix', () => {
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(NOW));
  afterEach(() => vi.restoreAllMocks());

  it('shows "⚡ IMMINENT" when game reveals in < 5 minutes (but > 0)', () => {
    // 3 minutes remaining
    const game = makeGame({ revealTimestampMs: NOW + 180_000 });
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [game], allGames: [game], isLoading: false, error: null, refetch: vi.fn() });
    vi.mocked(useIsAdmin).mockReturnValue({ isAdmin: true, adminAddress: '0x1', currentAddress: '0x1' });

    render(<RevealWatcher />, { wrapper: Wrapper });
    expect(screen.getByText(/IMMINENT/)).toBeInTheDocument();
  });

  it('shows "⚡ NOW" and not IMMINENT when remaining === 0', () => {
    const game = makeGame({ revealTimestampMs: NOW - 1_000 }); // past reveal
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [game], allGames: [game], isLoading: false, error: null, refetch: vi.fn() });
    vi.mocked(useIsAdmin).mockReturnValue({ isAdmin: true, adminAddress: '0x1', currentAddress: '0x1' });

    render(<RevealWatcher />, { wrapper: Wrapper });
    expect(screen.getByText('⚡ NOW')).toBeInTheDocument();
    expect(screen.queryByText(/IMMINENT/)).not.toBeInTheDocument();
  });

  it('shows countdown (no IMMINENT) when remaining > 5 minutes', () => {
    const game = makeGame({ revealTimestampMs: NOW + 600_000 }); // 10 minutes
    vi.mocked(useActiveGames).mockReturnValue({ activeGames: [game], allGames: [game], isLoading: false, error: null, refetch: vi.fn() });
    vi.mocked(useIsAdmin).mockReturnValue({ isAdmin: true, adminAddress: '0x1', currentAddress: '0x1' });

    render(<RevealWatcher />, { wrapper: Wrapper });
    expect(screen.queryByText(/IMMINENT/)).not.toBeInTheDocument();
  });
});
