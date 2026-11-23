import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Settings from './Settings';
import * as Auth from '@services/auth';

const { mockNavigate, mockGetTestTaker } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetTestTaker: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAuthUser = { signInDetails: { loginId: 'test@example.com' } };
const mockUserProfile = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test.user@example.com',
  displayName: 'Test User',
};

vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isLoading: false,
  }),
}));

vi.mock('@context/UserProfileContext', () => ({
  useUserProfileContext: () => ({
    profile: mockUserProfile,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@services/auth', () => ({
  changePassword: vi.fn(),
}));

vi.mock('@components/Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar" />,
}));

vi.mock('@services', () => ({
  EnrolmentService: { 
    getTestTaker: mockGetTestTaker,
  },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Settings />
    </MemoryRouter>
  );
}

function getNewPasswordInput() {
  return document.querySelector('input#new-password') as HTMLInputElement;
}

describe('Settings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetTestTaker.mockResolvedValue({
      givenName: 'Test',
      familyName: 'User',
      contactEmail: 'test.user@example.com',
      dateOfBirth: '1990-05-15',
      hasSeenGuide: true,
    });
  });

  it('renders tab sidebar with Profile, Password, Notifications, Account', () => {
    renderPage();
    expect(screen.getByRole('tab', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Password' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Account' })).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    renderPage();
    const profileTab = screen.getByRole('tab', { name: 'Profile' });
    expect(profileTab).toHaveAttribute('aria-selected', 'true');
  });

  it('loads test taker profile from EnrolmentService', async () => {
    renderPage();
    await waitFor(() => {
      expect(mockGetTestTaker).toHaveBeenCalledTimes(1);
    });
  });

  describe('Profile Tab', () => {
    it('shows profile section fields - first name, last name, email, date of birth', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
      });
    });

    it('profile fields are read-only', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeDisabled();
        expect(screen.getByLabelText(/last name/i)).toBeDisabled();
        expect(screen.getByLabelText(/email/i)).toBeDisabled();
        expect(screen.getByLabelText(/date of birth/i)).toBeDisabled();
      });
    });

    it('renders support email link', () => {
      renderPage();
      const supportLink = screen.getByRole('link', { name: /support@idpenglishtest\.com/i });
      expect(supportLink).toBeInTheDocument();
      expect(supportLink).toHaveAttribute('href', 'mailto:support@idpenglishtest.com');
    });

    it('displays formatted date of birth', async () => {
      renderPage();
      await waitFor(() => {
        const dobField = screen.getByLabelText(/date of birth/i) as HTMLInputElement;
        expect(dobField.value).toBe('15 May 1990');
      });
    });
  });

  describe('Password Tab', () => {
    beforeEach(() => {
      renderPage();
      fireEvent.click(screen.getByRole('tab', { name: 'Password' }));
    });

    it('renders password change form fields', () => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      const newPasswordInput = document.querySelector('input#new-password');
      expect(newPasswordInput).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    });

    it('shows password policy helper text', () => {
      expect(screen.getByText(/Password must be at least 12 characters with 1 uppercase, 1 lowercase, and 1 number/i)).toBeInTheDocument();
    });

    it('validates all fields are required', async () => {
      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
        expect(screen.getByText(/new password is required/i)).toBeInTheDocument();
        expect(screen.getByText(/please confirm your new password/i)).toBeInTheDocument();
      });
    });

    it('validates password policy client-side', async () => {
      const newPasswordInput = document.querySelector('input#new-password') as HTMLInputElement;
      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'OldPass123!' },
      });
      fireEvent.change(newPasswordInput, {
        target: { value: 'weak' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'weak' },
      });

      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 12 characters with 1 uppercase, 1 lowercase, and 1 number/i)).toBeInTheDocument();
      });
    });

    it('validates new password and confirmation match', async () => {
      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'OldPass123!' },
      });
      const newPasswordInput = getNewPasswordInput();
      fireEvent.change(newPasswordInput, {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'DifferentPass123!' },
      });

      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('prevents new password from being identical to current password', async () => {
      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'SamePass123!' },
      });
      const newPasswordInput = getNewPasswordInput();
      fireEvent.change(newPasswordInput, {
        target: { value: 'SamePass123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'SamePass123!' },
      });

      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/New password must be different from your current password/i)).toBeInTheDocument();
      });
    });

    it('clears field errors when user starts typing', async () => {
      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'O' },
      });
      
      await waitFor(() => {
        expect(screen.queryByText(/current password is required/i)).not.toBeInTheDocument();
      });
    });

    it('displays error when current password is incorrect', async () => {
      vi.mocked(Auth.changePassword).mockRejectedValueOnce(
        new Error('Current password is incorrect.')
      );

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'WrongPass123!' },
      });
      const newPasswordInput = getNewPasswordInput();
      fireEvent.change(newPasswordInput, {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPassword123!' },
      });

      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });
    });

    it('displays success message on successful password change', async () => {
      vi.mocked(Auth.changePassword).mockResolvedValueOnce(undefined);

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'OldPass123!' },
      });
      const newPasswordInput = getNewPasswordInput();
      fireEvent.change(newPasswordInput, {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPassword123!' },
      });

      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password updated successfully/i)).toBeInTheDocument();
      });
    });

    it('clears password fields after successful password change', async () => {
      vi.mocked(Auth.changePassword).mockResolvedValueOnce(undefined);

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'OldPass123!' },
      });
      const newPasswordInput = getNewPasswordInput();
      fireEvent.change(newPasswordInput, {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPassword123!' },
      });

      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toHaveValue('');
        expect(getNewPasswordInput()).toHaveValue('');
        expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('');
      });
    });

    it('hides error message when user types in current password field', async () => {
      vi.mocked(Auth.changePassword).mockRejectedValueOnce(new Error('Current password is incorrect.'));

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'WrongPass123!' },
      });
      const newPasswordInput = getNewPasswordInput();
      fireEvent.change(newPasswordInput, {
        target: { value: 'NewPassword123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPassword123!' },
      });

      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'W' },
      });
      
      await waitFor(() => {
        expect(screen.queryByText(/current password is incorrect/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Notifications Tab', () => {
    it('renders notification preferences section', () => {
      renderPage();
      fireEvent.click(screen.getByRole('tab', { name: 'Notifications' }));
      expect(screen.getByRole('heading', { name: /notification preferences/i })).toBeInTheDocument();
    });
  });

  describe('Account Tab', () => {
    it('renders delete account section', () => {
      renderPage();
      fireEvent.click(screen.getByRole('tab', { name: 'Account' }));
      expect(screen.getByRole('heading', { level: 2, name: /delete your account/i })).toBeInTheDocument();
    });
  });
});
