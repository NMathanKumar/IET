/**
 * Input Component
 * Reusable input field component using Tailwind CSS
 * Follows project design tokens from src/styles/variables.css
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  type?: string;
  name: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  autoComplete?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  autoComplete,
  ...props
}) => {
  const inputClasses = `px-3.5 py-2.75 text-sm border rounded-lg font-sans transition-all ${
    error
      ? 'border-red-600 focus:outline-none focus:border-red-600 focus:ring-3 focus:ring-red-100'
      : `border-border-default focus:outline-none focus:border-brand-primary focus:ring-3 focus:ring-brand-primary/[0.1]`
  } ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''} ${className}`;

  const errorId = error && name ? `${name}-error` : undefined;
  const helperId = helperText && name ? `${name}-helper` : undefined;
  const describedBy =
    [errorId, !error ? helperId : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && (
        <label
          htmlFor={props.id || name}
          className="font-['Inter'] text-xs font-bold uppercase tracking-[0.66px] text-slate"
        >
          {label}
          {required && <span className="text-brand-primary ml-1">*</span>}
        </label>
      )}
      <input
        id={props.id || name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={inputClasses}
        autoComplete={autoComplete}
        {...props}
      />
      {error && (
        <span id={errorId} className="text-xs text-red-600 -mt-1" role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={helperId} className="text-xs text-slate -mt-1">
          {helperText}
        </span>
      )}
    </div>
  );
};

export default Input;
