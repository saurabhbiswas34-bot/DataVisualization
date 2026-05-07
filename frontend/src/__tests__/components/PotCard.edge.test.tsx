/**
 * PotCard edge cases:
 * - Urgent red countdown when reveal < 1 hour away
 * - Timer cleanup on unmount
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import PotCard from '../../components/PotCard';
import { makeGame, NOW } from '../../test-utils/factories';
import { Wrapper } from '../../test-utils/wrappers';

vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => ({ priceUSD: 1.0, isLoading: false }),
}));

describe('PotCard — urgent countdown styling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows red countdown when reveal is within 1 hour (open game)', () => {
    // 30 minutes until reveal — under 1h threshold
    const game = makeGame({
      revealTimestampMs: NOW + 1_800_000, // 30 min
      lockoutTimestampMs: NOW - 1,        // already locked... wait, if locked it shows different UI
    });
    // Make it open (lockout in future) but reveal within 1h
    const openUrgentGame = makeGame({
      revealTimestampMs: NOW + 1_800_000,  // 30 min
      lockoutTimestampMs: NOW + 3_600_001, // lockout > now so still open
    });
    const { container } = render(<PotCard game={openUrgentGame} />, { wrapper: Wrapper });
    // When remaining < 3_600_000ms, text becomes red
    expect(container.querySelector('.text-red-400')).toBeInTheDocument();
  });

  it('shows teal countdown when reveal is > 1 hour away', () => {
    const game = makeGame({ revealTimestampMs: NOW + 7_200_000 }); // 2 hours
    const { container } = render(<PotCard game={game} />, { wrapper: Wrapper });
    expect(container.querySelector('.text-teal-400')).toBeInTheDocument();
  });

  it('clears timer interval on unmount', () => {
    const clearSpy = vi.spyOn(global, 'clearInterval');
    const game = makeGame({ revealTimestampMs: NOW + 7_200_000 });
    const { unmount } = render(<PotCard game={game} />, { wrapper: Wrapper });
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
