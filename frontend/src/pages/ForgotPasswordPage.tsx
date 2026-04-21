import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { CognitoError, cognitoConfirmForgotPassword, cognitoForgotPassword } from "@/features/auth/cognito";
import { BrandMark } from "@/components/layout";
import { PasswordInput } from "@/components/inputs/PasswordInput";
import { PasswordRules, isPasswordValid } from "@/components/inputs/PasswordRules";

type Step = "email" | "reset";

const inputClass =
  "brut-border min-h-[44px] w-full bg-card px-3 py-2 text-sm text-ink outline-none";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await cognitoForgotPassword(email);
      setStep("reset");
    } catch (err) {
      if (err instanceof CognitoError) {
        setError(err.message);
      } else {
        setError("Failed to send reset code");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await cognitoConfirmForgotPassword(email, code, newPassword);
      navigate("/login");
    } catch (err) {
      if (err instanceof CognitoError) {
        setError(err.message);
      } else {
        setError("Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="animate-in brut-border brut-shadow-lg w-full max-w-sm bg-card p-8">
        <div className="mb-4 flex justify-center">
          <BrandMark size="lg" />
        </div>
        <h1 className="mb-2 text-center text-4xl font-bold tracking-tight text-ink">
          Foos<span className="text-team-red">League</span>
        </h1>
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-wider text-ink-soft">
          {step === "email" ? "Reset your password" : "Enter the code sent to your email"}
        </p>

        {error && (
          <div className="brut-border mb-4 bg-coral px-3 py-2 text-sm font-semibold text-ink">
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="brut-border btn-press brut-shadow min-h-[48px] w-full bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors disabled:bg-ink-muted"
            >
              {loading ? "Sending..." : "Send reset code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className={labelClass}>Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`${inputClass} font-mono tracking-[0.3em]`}
                required
                autoComplete="one-time-code"
                placeholder="123456"
              />
            </div>
            <div>
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                label="New Password"
                autoComplete="new-password"
                minLength={8}
              />
              <PasswordRules password={newPassword} />
            </div>
            <div>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                label="Confirm Password"
                autoComplete="new-password"
                minLength={8}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs font-semibold text-danger">
                  Passwords do not match
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !isPasswordValid(newPassword)}
              className="brut-border btn-press brut-shadow min-h-[48px] w-full bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors disabled:bg-ink-muted"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm font-medium text-ink-soft">
          <Link to="/login" className="font-bold text-ink underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
