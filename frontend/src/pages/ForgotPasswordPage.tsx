import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { CognitoError, cognitoConfirmForgotPassword, cognitoForgotPassword } from "@/features/auth/cognito";
import { PasswordInput } from "@/components/inputs/PasswordInput";
import { PasswordRules, isPasswordValid } from "@/components/inputs/PasswordRules";

type Step = "email" | "reset";

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

  const inputClass =
    "w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="animate-in w-full max-w-sm rounded-xl border border-border bg-bg-secondary p-8 shadow-sm">
        <h1 className="brand-gradient mb-2 text-center text-3xl font-bold">
          FoosLeague
        </h1>
        <p className="mb-8 text-center text-sm text-text-secondary">
          {step === "email" ? "Reset your password" : "Enter the code sent to your email"}
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendCode}>
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-text-secondary">Email</label>
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
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-text-secondary">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={inputClass}
                required
                autoComplete="one-time-code"
                placeholder="123456"
              />
            </div>
            <div className="mb-4">
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                label="New Password"
                autoComplete="new-password"
                minLength={8}
              />
              <PasswordRules password={newPassword} />
            </div>
            <div className="mb-6">
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                label="Confirm Password"
                autoComplete="new-password"
                minLength={8}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-danger">Passwords do not match</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !isPasswordValid(newPassword)}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
