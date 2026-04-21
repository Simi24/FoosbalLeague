import { MdCheck, MdClose } from "react-icons/md";

const RULES = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[a-z]/.test(p), label: "Lowercase letter" },
  { test: (p: string) => /[A-Z]/.test(p), label: "Uppercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "Number" },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), label: "Special character" },
];

export const PasswordRules = ({ password }: { password: string }) => {
  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1">
      {RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-2 text-xs font-medium ${
              passed ? "text-ink" : "text-ink-muted"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center border-2 border-ink ${
                passed ? "bg-mint" : "bg-coral"
              }`}
            >
              {passed ? <MdCheck size={12} /> : <MdClose size={12} />}
            </span>
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
};

export const isPasswordValid = (password: string): boolean =>
  RULES.every((rule) => rule.test(password));
