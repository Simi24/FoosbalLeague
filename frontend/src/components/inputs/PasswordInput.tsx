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
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium text-text-secondary">{label}</label>
        {labelRight}
      </div>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 pr-10 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted transition-colors hover:text-text-secondary"
        >
          {visible ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
        </button>
      </div>
    </div>
  );
};
