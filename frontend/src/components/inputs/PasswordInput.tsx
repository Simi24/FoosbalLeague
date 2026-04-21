import { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  labelRight?: React.ReactNode;
};

export const PasswordInput = ({
  value,
  onChange,
  label,
  autoComplete = "current-password",
  required = true,
  minLength,
  labelRight,
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-semibold uppercase tracking-wide text-ink">{label}</label>
        {labelRight}
      </div>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="brut-border min-h-[44px] w-full bg-card px-3 py-2 pr-11 text-sm text-ink outline-none placeholder:text-ink-muted"
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="btn-press absolute right-1.5 top-1/2 -translate-y-1/2 border-2 border-transparent p-1 text-ink-soft transition-colors hover:border-ink hover:bg-butter hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
        </button>
      </div>
    </div>
  );
};
