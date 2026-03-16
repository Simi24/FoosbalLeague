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
    <div className="mt-2 space-y-1">
      {RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <div
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs ${passed ? "text-success" : "text-text-muted"}`}
          >
            {passed ? <MdCheck size={14} /> : <MdClose size={14} />}
            <span>{rule.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export const isPasswordValid = (password: string): boolean =>
  RULES.every((rule) => rule.test(password));
