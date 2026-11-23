import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import signupStudent from '@assets/idp-signup-student.png';

export interface GuardianDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  relationship: string;
  relationshipDetails?: string;
  email: string;
  consentGiven: boolean;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  termsAccepted: boolean;
  termsVersion: string;
  guardian?: GuardianDetails;
}

export interface SignUpProps {
  onSubmit?: (credentials: SignUpCredentials) => Promise<void>;
}

export function isUnder18(dateOfBirth: string) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayHasPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!birthdayHasPassed) age -= 1;
  return age < 18;
}

function validatePassword(password: string): string | null {
  if (!password) return null;
  if (password.length < 12) return 'Password must be at least 12 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least 1 uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least 1 lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain at least 1 number';
  return null;
}

function todayIso(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const GUARDIAN_COUNTRIES = [
  'Australia',
  'New Zealand',
  'Canada',
  'United Kingdom',
  'United States',
  'Other',
];

export function SignUp({ onSubmit }: SignUpProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfBirthError, setDateOfBirthError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [guardianFirstName, setGuardianFirstName] = useState('');
  const [guardianLastName, setGuardianLastName] = useState('');
  const [guardianDateOfBirth, setGuardianDateOfBirth] = useState('');
  const [guardianCountry, setGuardianCountry] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [guardianRelationshipDetails, setGuardianRelationshipDetails] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const needsGuardian = Boolean(dateOfBirth) && isUnder18(dateOfBirth);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(value ? validatePassword(value) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dateOfBirth) {
      setDateOfBirthError('Enter your date of birth to continue.');
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }

    if (
      needsGuardian &&
      guardianEmail.trim().toLowerCase() === email.trim().toLowerCase()
    ) {
      setError("The parent or guardian's email must be different from the test taker's email.");
      return;
    }

    if (!onSubmit) {
      setError('Sign up handler not configured');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        email,
        password,
        firstName,
        lastName,
        dateOfBirth,
        gender: '',
        termsVersion: '1.0',
        termsAccepted,
        guardian: needsGuardian
          ? {
              firstName: guardianFirstName,
              lastName: guardianLastName,
              dateOfBirth: guardianDateOfBirth,
              country: guardianCountry,
              relationship: guardianRelationship,
              relationshipDetails:
                guardianRelationship === 'other' ? guardianRelationshipDetails : undefined,
              email: guardianEmail,
              consentGiven: guardianConsent,
            }
          : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-surface-light overflow-x-hidden">
      {/* Left Panel - Hidden on mobile, Sticky */}
      <div className="hidden md:flex md:w-[45%] flex-col justify-center items-center p-6 md:p-10 relative overflow-hidden bg-surface-light sticky top-0 h-screen">
        <div className="absolute top-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full bg-white/10" />
        <div className="absolute bottom-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full bg-white/[0.08]" />
        <div className="relative z-10 w-full max-w-[400px]">
          <img
            src={signupStudent}
            alt="Student preparing to study"
            className="w-full h-auto object-contain mb-6"
          />
          <h2 className="text-xl font-bold text-ink mb-4">One account for your English test journey</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-brand-primary font-bold flex-shrink-0">✓</span>
              <p className="text-sm text-slate">Access your personalised dashboard and results.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-brand-primary font-bold flex-shrink-0">✓</span>
              <p className="text-sm text-slate">Practise all four skills at your own pace.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-brand-primary font-bold flex-shrink-0">✓</span>
              <p className="text-sm text-slate">Manage your tests and certificates in one place.</p>
            </div>
          </div>
          <p className="text-xs text-slate mt-4">
            <strong className="text-ink">Clear and simple.</strong> Your account keeps your preparation, purchases, and results together.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-3 sm:p-4 md:p-9 bg-surface-light min-h-screen md:min-h-auto">
        <form className="w-full max-w-[590px] px-4 sm:px-5 md:px-[44px] py-6 sm:py-7 md:py-[40px] rounded-lg md:rounded-[20px] bg-white border border-border-alt shadow-[0_16px_45px_rgba(35,45,63,0.12)]" onSubmit={handleSubmit}>
          
          {/* Header */}
          <div className="mb-5 sm:mb-6 md:mb-[28px] text-center">
            <h1 className="text-xl sm:text-2xl md:text-[24px] font-black text-ink mb-1 md:mb-2 m-0 leading-tight">
              Create your IDP English Test Account
            </h1>
            <p className="text-xs sm:text-sm md:text-[13px] text-slate m-0 leading-relaxed">
              * Mandatory fields
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-3 sm:mb-4 md:mb-4 p-2.5 sm:p-3 md:p-3.5 rounded-lg bg-surface-error-light border border-surface-error-light text-brand-red text-xs sm:text-xs md:text-[13px] leading-relaxed">
              {error}
            </div>
          )}

          {/* Info banner */}
          <div className="mb-4 p-3 rounded-lg bg-surface-brand border-l-4 border-brand-primary text-slate text-xs">
            Enter your name exactly as it appears on your passport or national ID.
          </div>

          {/* Test Taker Fields */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label htmlFor="first-name" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">First name *</label>
              <input
                id="first-name"
                autoComplete="given-name"
                placeholder="Agnes"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-3 py-2.5 text-sm border border-border-default rounded-lg bg-white text-ink outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">Last name *</label>
              <input
                id="last-name"
                autoComplete="family-name"
                placeholder="Lee"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-3 py-2.5 text-sm border border-border-default rounded-lg bg-white text-ink outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">Email *</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="w-full px-3 py-2.5 text-sm border border-border-default rounded-lg bg-white text-ink outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">Password *</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-3 py-2.5 text-sm border border-border-default rounded-lg bg-white text-ink outline-none pr-16 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate font-bold bg-none border-none cursor-pointer disabled:cursor-not-allowed"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="mt-2 text-xs text-slate space-y-1">
              <div className="flex gap-4">
                <label className="flex items-center gap-1">
                  <span className={password.length >= 12 ? "text-success font-bold" : "text-grey-light"}>✓</span>
                  <span className={password.length >= 12 ? "text-success font-bold" : ""}>12+ characters</span>
                </label>
                <label className="flex items-center gap-1">
                  <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-success font-bold" : "text-grey-light"}>✓</span>
                  <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-success font-bold" : ""}>Upper & lower</span>
                </label>
                <label className="flex items-center gap-1">
                  <span className={/\d/.test(password) ? "text-success font-bold" : "text-grey-light"}>✓</span>
                  <span className={/\d/.test(password) ? "text-success font-bold" : ""}>1 number</span>
                </label>
              </div>
            </div>
            {passwordError && (
              <p className="text-brand-red text-xs mt-2">{passwordError}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="dob" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">Date of birth *</label>
            <input
              id="dob"
              type="date"
              autoComplete="bday"
              value={dateOfBirth}
              max={todayIso()}
              onChange={(e) => {
                setDateOfBirth(e.target.value);
                setDateOfBirthError('');
              }}
              disabled={isLoading}
              required
              className="w-full px-3 py-2.5 text-sm border border-border-default rounded-lg bg-white text-slate outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {dateOfBirthError && (
              <p className="text-brand-red text-xs mt-1">{dateOfBirthError}</p>
            )}
          </div>

          {/* Guardian Section */}
          {needsGuardian && (
            <div className="mb-6 pt-6 border-t border-border-default">
              <h2 className="text-base font-semibold text-ink mb-2">Parent or guardian details</h2>
              <p className="text-xs text-slate mb-4">
                As the test taker is a minor, parent or guardian details are required to complete the sign up.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="g-first-name" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">First name *</label>
                  <input
                    id="g-first-name"
                    autoComplete="off"
                    value={guardianFirstName}
                    onChange={(e) => setGuardianFirstName(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-white text-ink text-sm outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="g-last-name" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">Last name *</label>
                  <input
                    id="g-last-name"
                    autoComplete="off"
                    value={guardianLastName}
                    onChange={(e) => setGuardianLastName(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-white text-ink text-sm outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="g-dob" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">Date of birth *</label>
                  <input
                    id="g-dob"
                    type="date"
                    value={guardianDateOfBirth}
                    onChange={(e) => setGuardianDateOfBirth(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-white text-slate text-sm outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="g-country" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">Country of residence *</label>
                  <select
                    id="g-country"
                    value={guardianCountry}
                    onChange={(e) => setGuardianCountry(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-white text-ink text-sm outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select country</option>
                    {GUARDIAN_COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="g-relationship" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">Relationship *</label>
                  <select
                    id="g-relationship"
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-white text-ink text-sm outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select relationship</option>
                    <option value="parent">Parent</option>
                    <option value="legal-guardian">Legal guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {guardianRelationship === 'other' && (
                  <div className="md:col-span-2">
                    <label htmlFor="g-details" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">Relationship details *</label>
                    <input
                      id="g-details"
                      placeholder="Describe your relationship"
                      value={guardianRelationshipDetails}
                      onChange={(e) => setGuardianRelationshipDetails(e.target.value)}
                      disabled={isLoading}
                      required
                      className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-white text-ink text-sm outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label htmlFor="g-email" className="block text-xs font-bold text-slate uppercase tracking-wide mb-2">Email address *</label>
                  <input
                    id="g-email"
                    type="email"
                    autoComplete="off"
                    placeholder="guardian@example.com"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-white text-ink text-sm outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-surface-brand border-l-4 border-brand-primary flex gap-2">
                <span className="text-brand-primary flex-shrink-0">ℹ️</span>
                <p className="text-slate text-xs leading-relaxed m-0">
                  The parent or guardian may be contacted to confirm their details and provide consent.
                </p>
              </div>

              <label className="flex items-start gap-2.5 text-slate cursor-pointer text-xs leading-relaxed mb-4">
                <input
                  type="checkbox"
                  checked={guardianConsent}
                  onChange={(e) => setGuardianConsent(e.target.checked)}
                  disabled={isLoading}
                  required
                  className="w-[18px] h-[18px] mt-0.5 flex-shrink-0 accent-grey-medium-alt cursor-pointer"
                />
                <span>
                  I am the parent or legal guardian of this test taker and I agree to the{' '}
                  <strong className="text-brand-primary font-bold">Terms of Service and Privacy Policy</strong> on their behalf.
                </span>
              </label>
            </div>
          )}

          {/* Terms Checkbox */}
          <label className="flex items-start gap-2 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={isLoading}
              required
              className="w-[15px] h-[15px] mt-0.5 flex-shrink-0 accent-brand-primary cursor-pointer"
            />
            <span className="text-xs text-slate leading-relaxed">
              I agree to the{' '}
              <strong className="text-brand-primary font-bold">Terms of Service and Privacy Policy</strong>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg border-none bg-brand-primary text-white text-sm font-bold mb-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 hover:bg-brand-primary-hover transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Create my account →'}
          </button>

          {/* Sign In Link */}
          <div className="text-center">
            <span className="text-xs text-slate">
              Already have an account?{' '}
            </span>
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="text-xs text-brand-primary bg-none border-none cursor-pointer font-bold p-0 hover:underline disabled:cursor-not-allowed"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
