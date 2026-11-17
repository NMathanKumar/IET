import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { EnrolmentService } from '@services';
import AppIcon, { type AppIconName } from '@components/AppIcon';

const ONBOARDING_STEPS: {
  title: string;
  description: string;
  detail: string;
  actionLabel: string;
  destination: string;
  icon: AppIconName;
}[] = [
  {
    title: 'Practice skills for free',
    description: 'Try short practice tasks for Listening, Reading, Speaking and Writing in the same format as the real test.',
    detail: 'Practise at your own pace, as often as you like.',
    actionLabel: 'Start practising',
    destination: '/practice',
    icon: 'practice',
  },
  {
    title: 'Buy when you\'re ready',
    description: 'Choose your test, complete your enrolment and manage everything from one simple account.',
    detail: 'You have 21 days to take the test after purchase. No need to book a date now.',
    actionLabel: 'Purchase a test',
    destination: '/book',
    icon: 'purchase',
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExit: () => Promise<void>;
}

export default function OnboardingModal({ isOpen, onClose, onExit }: OnboardingModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [userName, setUserName] = useState<string>('');
  const [hasExited, setHasExited] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const step = ONBOARDING_STEPS[stepIndex];

  // Fetch user profile to get real name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;

      try {
        // Try to get from TestTaker profile first
        const profile = await EnrolmentService.getTestTaker();
        if (profile?.givenName) {
          setUserName(profile.givenName);
          return;
        }
      } catch (error) {
        // Could not fetch TestTaker profile, fallback to Cognito
      }

      // Fallback to Cognito user attributes
      const firstName = 
        (user as any)?.attributes?.given_name ||
        (user as any)?.given_name ||
        (user as any)?.username?.split('@')[0] ||
        'there';
      setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
    };

    fetchUserName();
  }, [user]);

  // Handle focus trap and keyboard events
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      }

      // Handle Tab key for focus trap
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        const activeElement = document.activeElement;

        if (e.shiftKey) {
          if (activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Focus the first focusable element when modal opens
    setTimeout(() => {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }, 0);

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleExit = useCallback(async () => {
    // Prevent multiple exit calls
    if (hasExited) return;
    setHasExited(true);

    try {
      await onExit();
    } catch (error) {
      console.error('OnboardingModal: Failed to mark onboarding as seen:', error);
    }
    onClose();
  }, [hasExited, onExit, onClose]);

  const handleAction = async (destination: string) => {
    await handleExit();
    navigate(destination, { replace: false });
  };

  if (!isOpen || hasExited) return null;

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleExit}
        role="presentation"
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Modal card */}
        <div
          ref={modalRef}
          className="w-full max-w-[820px] bg-white border-[1.5px] border-[#dde2e7] rounded-[22px] overflow-hidden shadow-[0_24px_60px_rgba(35,45,63,0.14)] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-[#55657b] hover:text-[#232d3f] transition-colors text-xl"
            onClick={handleExit}
            aria-label="Close onboarding"
            title="Close (Esc)"
            type="button"
          >
            ✕
          </button>

          {/* Content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_0.65fr] gap-11 min-h-[360px] p-12 items-center">
            {/* Left: Text content */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#eb7900] mb-2.5 m-0">
                Welcome, {userName || 'there'} <span aria-hidden="true">·</span> {stepIndex + 1} of {ONBOARDING_STEPS.length}
              </p>
              <h1
                id="onboarding-title"
                className="text-[clamp(27px,4vw,38px)] font-bold leading-[1.16] text-[#232d3f] mb-3 font-['Farro',sans-serif]"
              >
                {step.title}
              </h1>
              <p className="text-[15px] leading-[1.7] text-[#55657b] mb-4.5 max-w-[560px]">
                {step.description}
              </p>

              {/* Detail with checkmark */}
              <div className="flex gap-2.25 mb-6 items-start">
                <span className="flex items-center justify-center w-[19px] h-[19px] flex-shrink-0 rounded-full bg-[#fff3ea] text-[#eb7900] text-[11px] font-black">
                  ✓
                </span>
                <p className="text-[12px] text-[#55657b] m-0 leading-[1.5]">
                  {step.detail}
                </p>
              </div>

              {/* Primary action button */}
              <button
                className="inline-flex items-center gap-2.25 px-4 py-2.5 border-[1.5px] border-[rgba(235,121,0,0.38)] rounded-[8px] bg-white text-[#232d3f] hover:border-[#eb7900] hover:bg-[#fff3ea] cursor-pointer font-bold text-[13px] transition-colors duration-160"
                type="button"
                onClick={() => handleAction(step.destination)}
              >
                {step.actionLabel}
                <span aria-hidden="true">→</span>
              </button>
            </div>

            {/* Right: Visual */}
            <div className="hidden lg:flex flex-col items-center justify-center gap-4.5 min-h-[220px] p-6 border-[1.5px] border-[rgba(255,106,0,0.2)] rounded-[16px] bg-[#fff3ea] text-[#eb7900] text-center" aria-hidden="true">
              <div className="flex items-center justify-center w-[104px] h-[104px] border-2 border-[rgba(255,106,0,0.22)] rounded-full bg-white shadow-[0_10px_30px_rgba(235,121,0,0.12)]">
                <AppIcon name={step.icon} size={48} />
              </div>
              <span className="text-[12px] font-bold text-[#232d3f]">
                {stepIndex === 0 ? 'Build confidence' : 'Take your next step'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex min-h-[82px] p-4.5 lg:p-[18px_28px_18px_50px] items-center justify-between gap-6 border-t border-[#e9edf0] bg-[#fcfcfb]">
            {/* Progress dots */}
            <div className="flex items-center gap-1.75">
              {ONBOARDING_STEPS.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={`border-0 rounded-[10px] cursor-pointer transition-all duration-160 p-0 h-2.25 ${
                    index === stepIndex
                      ? 'w-3 lg:w-[30px] bg-[#eb7900]'
                      : 'w-2.25 bg-[#d9dde1]'
                  }`}
                  aria-label={`Go to step ${index + 1}: ${item.title}`}
                  aria-current={index === stepIndex ? 'step' : undefined}
                  onClick={() => setStepIndex(index)}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-end gap-2.5">
              {stepIndex > 0 && (
                <button
                  className="min-h-[42px] px-3.5 py-2.5 border-0 rounded-[8px] bg-transparent text-[#55657b] hover:bg-[#f5f5f5] hover:text-[#232d3f] cursor-pointer text-[12px] font-bold transition-colors"
                  type="button"
                  onClick={() => setStepIndex(stepIndex - 1)}
                >
                  Back
                </button>
              )}
              <button
                className="min-h-[42px] px-3.5 py-2.5 border-0 rounded-[8px] bg-transparent text-[#55657b] hover:bg-[#f5f5f5] hover:text-[#232d3f] cursor-pointer text-[12px] font-bold transition-colors"
                type="button"
                onClick={handleExit}
              >
                Skip to dashboard
              </button>
              {stepIndex < ONBOARDING_STEPS.length - 1 && (
                <button
                  className="inline-flex items-center justify-center gap-2 min-h-[42px] min-w-[100px] px-3.5 py-2.5 border-0 rounded-[8px] bg-[#eb7900] text-white cursor-pointer text-[12px] font-bold hover:bg-[#ad4300] transition-colors shadow-[0_7px_18px_rgba(235,121,0,0.2)]"
                  type="button"
                  onClick={() => setStepIndex(stepIndex + 1)}
                >
                  Next
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
