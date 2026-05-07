import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminGuard from '../../components/AdminGuard';
import { Wrapper } from '../../test-utils/wrappers';
import { ADMIN_ADDRESS, PLAYER_A } from '../../test-utils/factories';

const mockUseCurrentAccount = vi.fn();
const mockUseIsAdmin = vi.fn();

vi.mock('@iota/dapp-kit', () => ({
  useCurrentAccount: () => mockUseCurrentAccount(),
  ConnectButton: () => <button>Connect Wallet</button>,
}));

vi.mock('../../hooks/useIsAdmin', () => ({
  useIsAdmin: () => mockUseIsAdmin(),
}));

describe('AdminGuard', () => {
  it('shows "Admin Access Required" when not connected', () => {
    mockUseCurrentAccount.mockReturnValue(null);
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, adminAddress: '' });
    render(
      <AdminGuard><div>Admin Content</div></AdminGuard>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/Admin Access Required/i)).toBeInTheDocument();
  });

  it('shows ConnectButton when not connected', () => {
    mockUseCurrentAccount.mockReturnValue(null);
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, adminAddress: '' });
    render(
      <AdminGuard><div>Admin Content</div></AdminGuard>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('shows "Access Denied" for non-admin wallet', () => {
    mockUseCurrentAccount.mockReturnValue({ address: PLAYER_A });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, adminAddress: ADMIN_ADDRESS });
    render(
      <AdminGuard><div>Admin Content</div></AdminGuard>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
  });

  it('shows the connected address in access-denied screen', () => {
    mockUseCurrentAccount.mockReturnValue({ address: PLAYER_A });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, adminAddress: ADMIN_ADDRESS });
    render(
      <AdminGuard><div>Admin Content</div></AdminGuard>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(PLAYER_A)).toBeInTheDocument();
  });

  it('renders children when admin wallet connected', () => {
    mockUseCurrentAccount.mockReturnValue({ address: ADMIN_ADDRESS });
    mockUseIsAdmin.mockReturnValue({ isAdmin: true, adminAddress: ADMIN_ADDRESS });
    render(
      <AdminGuard><div>Admin Content</div></AdminGuard>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('shows admin wallet address in access-denied screen', () => {
    mockUseCurrentAccount.mockReturnValue({ address: PLAYER_A });
    mockUseIsAdmin.mockReturnValue({ isAdmin: false, adminAddress: ADMIN_ADDRESS });
    render(
      <AdminGuard><div>Admin Content</div></AdminGuard>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(ADMIN_ADDRESS)).toBeInTheDocument();
  });
});
