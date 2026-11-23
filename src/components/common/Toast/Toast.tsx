/**
 * Toast - Individual toast notification
 * Renders a single toast message with dismiss button.
 * Used by ToastProvider to render all toasts.
 */

export interface ToastProps {
  id: number;
  message: string;
  variant: 'info' | 'success' | 'error' | 'warning';
  onDismiss: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, variant, onDismiss }) => {
  const variantClasses = {
    info: 'border-l-info',
    success: 'border-l-success',
    error: 'border-l-brand-red',
    warning: 'border-l-warning',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2 p-4 rounded-md shadow-md bg-white border-l-4 text-ink text-sm ${variantClasses[variant]}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <p className="flex-1 m-0">{message}</p>
      <button
        type="button"
        className="flex-shrink-0 border-none bg-transparent cursor-pointer text-slate w-5 h-5 inline-flex items-center justify-center rounded hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(id)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path
            d="M3 3l6 6M9 3l-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
