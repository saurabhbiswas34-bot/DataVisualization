import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PriceDisplay from '../../components/PriceDisplay';
import { Wrapper } from '../../test-utils/wrappers';

const mockUseIotaPrice = vi.fn();

vi.mock('../../hooks/useIotaPrice', () => ({
  useIotaPrice: () => mockUseIotaPrice(),
}));

describe('PriceDisplay', () => {
  it('shows loading text while fetching', () => {
    mockUseIotaPrice.mockReturnValue({ isLoading: true, priceUSD: 0, minEntryIOTA: 0 });
    render(<PriceDisplay />, { wrapper: Wrapper });
    expect(screen.getByText(/Loading price/i)).toBeInTheDocument();
  });

  it('shows price when loaded', () => {
    mockUseIotaPrice.mockReturnValue({ isLoading: false, priceUSD: 0.42, minEntryIOTA: 2.38 });
    render(<PriceDisplay />, { wrapper: Wrapper });
    expect(screen.getByText(/\$0.4200 USD/i)).toBeInTheDocument();
  });

  it('shows minimum entry IOTA amount', () => {
    mockUseIotaPrice.mockReturnValue({ isLoading: false, priceUSD: 1.0, minEntryIOTA: 1.0 });
    render(<PriceDisplay />, { wrapper: Wrapper });
    expect(screen.getByText(/Min entry/i)).toBeInTheDocument();
  });

  it('shows green pulse dot when loaded', () => {
    mockUseIotaPrice.mockReturnValue({ isLoading: false, priceUSD: 1.0, minEntryIOTA: 1.0 });
    const { container } = render(<PriceDisplay />, { wrapper: Wrapper });
    expect(container.querySelector('.bg-green-400')).toBeInTheDocument();
  });
});
