import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useUserProfileContext } from '@context/UserProfileContext';
import { EnrolmentService } from '@services';
import { changePassword } from '@services/auth';
import type { TestTakerResponse } from '@services/enrolment';
import AppIcon from '@components/AppIcon';

const tabs = ['Profile', 'Password', 'Notifications', 'Account'] as const;
type Tab = (typeof tabs)[number];

const SUPPORT_EMAIL = 'support@idpenglishtest.com';

/** Fallback values for initial render if profile data is unavailable */
const FALLBACK_PROFILE = {
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  gender: '',
};

/** "1992-05-12" -> "12 May 1992" */
function formatDateOfBirth(value?: string): string | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function ReadOnlyField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="block text-[11px] font-bold uppercase tracking-[0.06em] mb-1.5"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </label>
      <input
        id={id}
        value={value ?? ''}
        type="text"
        readOnly
        disabled
        aria-readonly="true"
        className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] font-sans text-[13px] outline-none cursor-not-allowed"
        style={{
          borderColor: 'var(--color-border-alt)',
          backgroundColor: 'var(--color-muted)',
          color: 'var(--color-muted-foreground)',
        }}
      />
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  helperText,
  onFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  error?: string;
  helperText?: string;
  onFocus?: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="block text-[11px] font-bold uppercase tracking-[0.06em]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label} <span aria-hidden="true">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          autoComplete={autoComplete}
          required
          aria-required="true"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-hint` : undefined}
          className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border-[1.5px] font-sans text-[13px] outline-none bg-white transition-colors ${
            error ? 'border-red-500 focus:border-red-500' : 'focus:border-[var(--color-brand-primary)]'
          }`}
          style={{
            color: 'var(--color-text-primary)',
            borderColor: error ? undefined : 'var(--color-border-alt)',
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 text-[11px] font-bold rounded transition-colors"
          style={{
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLButtonElement).style.outline = '2px solid var(--color-brand-primary)';
            (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLButtonElement).style.outline = 'none';
          }}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && (
        <span id={`${id}-error`} role="alert" className="text-[11px] text-red-600">
          {error}
        </span>
      )}
      {helperText && !error && (
        <p id={`${id}-hint`} className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
          {helperText}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[16px] border-[1.5px] overflow-hidden mb-4"
      style={{ borderColor: 'var(--color-border-alt)', backgroundColor: 'var(--color-surface)' }}
    >
      <div
        className="px-6 py-4 border-b-[1.5px]"
        style={{ borderColor: 'var(--color-border-alt)' }}
      >
        <h2 className="text-[15px] font-black" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h2>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

function ComingSoonBadge() {
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{
        color: 'var(--color-text-secondary)',
        backgroundColor: 'var(--color-grey-lighter)',
      }}
    >
      Coming soon
    </span>
  );
}

function AlwaysOnBadge() {
  return (
    <span
      className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
      style={{
        color: 'var(--color-success)',
        backgroundColor: 'var(--color-surface-success-light)',
      }}
    >
      Always on
    </span>
  );
}

type PasswordFormStatus = { type: 'error' | 'success'; message: string } | null;

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile: userProfile } = useUserProfileContext();
  const [profile, setProfile] = useState<TestTakerResponse | null>(null);
  const [tab, setTab] = useState<Tab>('Profile');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<PasswordFormStatus>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submittingRef = useRef(false);

  // Load profile data
  useEffect(() => {
    if (!user || authLoading) return;
    let cancelled = false;
    EnrolmentService.getTestTaker()
      .then((result) => {
        if (!cancelled && result) setProfile(result);
      })
      .catch((error: unknown) => {
        console.error('Settings: Failed to load test taker profile:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const details = {
    firstName: profile?.givenName || userProfile.firstName,
    lastName: profile?.familyName || userProfile.lastName,
    email: (profile?.contactEmail || userProfile.email) as string,
    dateOfBirth: formatDateOfBirth(profile?.dateOfBirth) || FALLBACK_PROFILE.dateOfBirth,
  };

  // Clear field errors when user starts typing
  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value);
    if (fieldErrors['current-password']) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors['current-password'];
        return newErrors;
      });
    }
    if (passwordStatus) {
      setPasswordStatus(null);
    }
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    if (fieldErrors['new-password']) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors['new-password'];
        return newErrors;
      });
    }
    if (passwordStatus) {
      setPasswordStatus(null);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (fieldErrors['confirm-password']) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors['confirm-password'];
        return newErrors;
      });
    }
    if (passwordStatus) {
      setPasswordStatus(null);
    }
  };

  const handlePasswordInputFocus = () => {
    if (passwordStatus) {
      setPasswordStatus(null);
    }
  };

  // Password validation: at least 12 chars, 1 uppercase, 1 lowercase, 1 number
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/;

  function isPasswordValid(password: string): boolean {
    return PASSWORD_REGEX.test(password);
  }

  function validatePasswordForm(): boolean {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors['current-password'] = 'Current password is required.';
    }
    if (!newPassword) {
      errors['new-password'] = 'New password is required.';
    }
    if (!confirmPassword) {
      errors['confirm-password'] = 'Please confirm your new password.';
    }

    if (newPassword && !isPasswordValid(newPassword)) {
      errors['new-password'] = 'Password must be at least 12 characters with 1 uppercase, 1 lowercase, and 1 number.';
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors['confirm-password'] = 'Passwords do not match.';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors['new-password'] = 'New password must be different from your current password.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!validatePasswordForm()) return;

    submittingRef.current = true;
    setPasswordSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFieldErrors({});
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Password change failed. Please try again.';
      setPasswordStatus({ type: 'error', message });
    } finally {
      setPasswordSubmitting(false);
      submittingRef.current = false;
    }
  }

  return (
    <div className="max-w-[900px] mx-auto pb-12">
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Tab sidebar */}
        <div
          className="lg:w-40 flex-shrink-0 flex lg:flex-col gap-0 overflow-x-auto lg:overflow-x-visible w-full"
          role="tablist"
          aria-label="Settings sections"
        >
          {tabs.map((t) => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                id={`settings-tab-${t}`}
                aria-selected={isActive}
                aria-controls="settings-panel"
                onClick={() => setTab(t)}
                className={`block min-w-max lg:w-full text-left px-3.5 py-2.5 rounded-lg border-none cursor-pointer text-[13px] font-bold font-sans transition-all duration-150 mb-0.5 border-l-4 ${
                  isActive ? 'border-l-4' : 'border-l-4 border-transparent'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--color-surface-brand)',
                        color: 'var(--color-brand-primary)',
                        borderLeftColor: 'var(--color-brand-primary)',
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-secondary)',
                        borderLeftColor: 'transparent',
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-light)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div
          id="settings-panel"
          role="tabpanel"
          aria-labelledby={`settings-tab-${tab}`}
          className="flex-1 min-w-0"
        >
          {/* ── Profile ── */}
          {tab === 'Profile' && (
            <>
              <Section title="Personal Information">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    <ReadOnlyField id="first-name" label="First Name" value={details.firstName} />
                    <ReadOnlyField id="last-name" label="Last Name" value={details.lastName} />
                  </div>
                  <ReadOnlyField id="email" label="Email" value={details.email} />
                  <ReadOnlyField id="date-of-birth" label="Date of Birth" value={details.dateOfBirth} />
                </div>
              </Section>
              <p className="mx-0 my-0 mb-5 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                To make changes, please contact{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-bold no-underline transition-colors"
                  style={{ color: 'var(--color-brand-primary)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
                  }}
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </>
          )}

          {/* ── Password ── */}
          {tab === 'Password' && (
            <>
              <Section title="Change Password">
                <form
                  id="change-password-form"
                  onSubmit={handlePasswordSubmit}
                  noValidate
                  className="flex flex-col gap-3.5"
                >
                  {passwordStatus && (
                    <div
                      role={passwordStatus.type === 'success' ? 'status' : 'alert'}
                      aria-live="polite"
                      className="p-3 rounded-lg border-l-4"
                      style={{
                        backgroundColor:
                          passwordStatus.type === 'success'
                            ? 'var(--color-surface-success-light)'
                            : 'var(--color-surface-error-background)',
                        borderLeftColor:
                          passwordStatus.type === 'success'
                            ? 'var(--color-success)'
                            : 'var(--color-error)',
                        color: passwordStatus.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                      }}
                    >
                      <p className="text-[13px] leading-relaxed m-0">{passwordStatus.message}</p>
                    </div>
                  )}
                  <PasswordField
                    id="current-password"
                    label="Current Password"
                    value={currentPassword}
                    onChange={handleCurrentPasswordChange}
                    autoComplete="current-password"
                    error={fieldErrors['current-password']}
                    onFocus={handlePasswordInputFocus}
                  />
                  <PasswordField
                    id="new-password"
                    label="New Password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    autoComplete="new-password"
                    error={fieldErrors['new-password']}
                    helperText="Password must be at least 12 characters with 1 uppercase, 1 lowercase, and 1 number"
                    onFocus={handlePasswordInputFocus}
                  />
                  <PasswordField
                    id="confirm-password"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    autoComplete="new-password"
                    error={fieldErrors['confirm-password']}
                    onFocus={handlePasswordInputFocus}
                  />
                </form>
              </Section>
              <div className="flex justify-end">
                <button
                  type="submit"
                  form="change-password-form"
                  disabled={passwordSubmitting}
                  aria-disabled={passwordSubmitting}
                  className="px-5 py-2.5 rounded-lg border-none text-white text-[13px] font-bold cursor-pointer font-sans transition-opacity"
                  style={{
                    backgroundColor: 'var(--color-brand-primary)',
                    opacity: passwordSubmitting ? 0.6 : 1,
                    cursor: passwordSubmitting ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!passwordSubmitting) {
                      (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!passwordSubmitting) {
                      (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                    }
                  }}
                >
                  {passwordSubmitting ? 'Updating…' : 'Change password'}
                </button>
              </div>
            </>
          )}

          {/* ── Notifications ── */}
          {tab === 'Notifications' && (
            <Section title="Notification preferences">
              {details.email && (
                <p className="text-[13px] mb-4 -mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Emails go to{' '}
                  <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {details.email}
                  </span>
                </p>
              )}
              <div className="flex flex-col gap-0">
                {/* Account and results emails */}
                <div
                  className="flex items-center justify-between py-4 border-b-[1.5px]"
                  style={{ borderColor: 'var(--color-border-alt)' }}
                >
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      Account and results emails
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      Verification codes, receipts, test reminders, results ready.
                    </div>
                  </div>
                  <AlwaysOnBadge />
                </div>
                {/* Practice reminders toggle */}
                <div
                  className="flex items-center justify-between py-4 border-b-[1.5px]"
                  style={{ borderColor: 'var(--color-border-alt)' }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Practice reminders
                      </span>
                      <ComingSoonBadge />
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      Scheduled practice session reminders.
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={false}
                    aria-label="Practice reminders"
                    tabIndex={-1}
                    disabled
                    className="w-10 h-[22px] rounded-[11px] border-none relative p-0 flex-shrink-0 opacity-40 cursor-not-allowed pointer-events-none"
                    style={{ backgroundColor: 'var(--color-border-alt)' }}
                  >
                    <span
                      className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>
                {/* Study tips toggle */}
                <div
                  className="flex items-center justify-between py-4 border-b-[1.5px]"
                  style={{ borderColor: 'var(--color-border-alt)' }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Study tips
                      </span>
                      <ComingSoonBadge />
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      Tips to help you prepare for the test.
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={false}
                    aria-label="Study tips"
                    tabIndex={-1}
                    disabled
                    className="w-10 h-[22px] rounded-[11px] border-none relative p-0 flex-shrink-0 opacity-40 cursor-not-allowed pointer-events-none"
                    style={{ backgroundColor: 'var(--color-border-alt)' }}
                  >
                    <span
                      className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>
                {/* Platform updates toggle */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Platform updates
                      </span>
                      <ComingSoonBadge />
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      Important platform news and feature announcements.
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={false}
                    aria-label="Platform updates"
                    tabIndex={-1}
                    disabled
                    className="w-10 h-[22px] rounded-[11px] border-none relative p-0 flex-shrink-0 opacity-40 cursor-not-allowed pointer-events-none"
                    style={{ backgroundColor: 'var(--color-border-alt)' }}
                  >
                    <span
                      className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>
              </div>
            </Section>
          )}

          {/* ── Account ── */}
          {tab === 'Account' && (
            <>
              <div
                className="rounded-[16px] border-[1.5px] p-6"
                style={{ borderColor: 'var(--color-border-alt)', backgroundColor: 'var(--color-surface)' }}
              >
                <h2 className="text-[18px] font-black mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  Delete your account
                </h2>
                <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Deleting your account permanently removes your profile, test results and certificates.{' '}
                  <strong className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    This can&apos;t be undone.
                  </strong>
                </p>
                <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                  Because it&apos;s permanent, our support team handles deletion requests. We&apos;ll confirm it&apos;s you before anything is deleted.
                </p>

                {/* Certificate information strip */}
                <div
                  className="rounded-[10px] p-3.5 px-4 flex items-start gap-2.5 mb-6 text-[12px] leading-relaxed"
                  style={{
                    backgroundColor: 'var(--color-surface-info-very-light)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <span className="mt-0.5 flex-shrink-0 inline-flex" style={{ color: 'var(--color-info)' }}>
                    <AppIcon name="download" size={16} />
                  </span>
                  <div>
                    Need your certificate for an application?{' '}
                    <Link
                      to="/results"
                      className="font-bold transition-colors"
                      style={{ color: 'var(--color-info)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
                      }}
                    >
                      Download it from My Results
                    </Link>{' '}
                    before you ask us to delete your account.
                  </div>
                </div>

                {/* Support action row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=Account%20deletion%20request`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[13px] font-bold transition-colors no-underline"
                    style={{
                      borderColor: 'var(--color-text-primary)',
                      color: 'var(--color-text-primary)',
                      backgroundColor: 'var(--color-surface)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-surface-light)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-surface)';
                    }}
                  >
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                    <span>Contact support to delete</span>
                  </a>
                  <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                    or email
                  </span>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-bold text-[13px] no-underline transition-colors"
                    style={{ color: 'var(--color-brand-primary)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
                    }}
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
