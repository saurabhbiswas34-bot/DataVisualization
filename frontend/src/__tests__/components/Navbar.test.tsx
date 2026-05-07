import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from '../../components/Navbar';
import { Wrapper } from '../../test-utils/wrappers';

const mockUseIsAdmin = vi.fn();

vi.mock('../../hooks/useIsAdmin', () => ({
  useIsAdmin: () => mockUseIsAdmin(),
}));

vi.mock('@iota/dapp-kit', () => ({
  ConnectButton: () => <button data-testid="connect-btn">Connect</button>,
}));

describe('Navbar', () => {
  it('renders the brand name', () => {
    mockUseIsAdmin.mockReturnValue({ isAdmin: false });
    render(<Navbar />, { wrapper: Wrapper });
    expect(screen.getByText(/IOTA Matka Pot/i)).toBeInTheDocument();
  });

  it('renders Home link', () => {
    mockUseIsAdmin.mockReturnValue({ isAdmin: false });
    render(<Navbar />, { wrapper: Wrapper });
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders History link', () => {
    mockUseIsAdmin.mockReturnValue({ isAdmin: false });
    render(<Navbar />, { wrapper: Wrapper });
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('renders ConnectButton', () => {
    mockUseIsAdmin.mockReturnValue({ isAdmin: false });
    render(<Navbar />, { wrapper: Wrapper });
    expect(screen.getByTestId('connect-btn')).toBeInTheDocument();
  });

  it('shows Admin link when isAdmin=true', () => {
    mockUseIsAdmin.mockReturnValue({ isAdmin: true });
    render(<Navbar />, { wrapper: Wrapper });
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });

  it('does not show Admin link when isAdmin=false', () => {
    mockUseIsAdmin.mockReturnValue({ isAdmin: false });
    render(<Navbar />, { wrapper: Wrapper });
    expect(screen.queryByText('👑 Admin')).not.toBeInTheDocument();
  });
});
