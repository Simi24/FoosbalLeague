import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch } from "@/app/hooks";
import { apiFetch } from "@/api";
import {
  cognitoSignUp,
  cognitoConfirmSignUp,
  cognitoLogin,
  CognitoError,
  saveTokens,
  initAuth,
} from "@/features/auth";
import { BrandMark, Footer } from "@/components/layout";
import { PasswordInput } from "@/components/inputs/PasswordInput";
import { PasswordRules, isPasswordValid } from "@/components/inputs/PasswordRules";

type Step = "register" | "verify";

const inputClass =
  "brut-border min-h-[44px] w-full bg-card px-3 py-2 text-sm text-ink outline-none";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink";

export const SignupPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordValid = isPasswordValid(password);
  const passwordsMatch = password === confirmPassword;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError("Password does not meet the requirements");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }
    if (!acceptedPrivacy) {
      setError("You must accept the Privacy Policy");
      return;
    }

    setLoading(true);
    try {
      await cognitoSignUp(email, password, displayName);
      setStep("verify");
    } catch (err) {
      setError(err instanceof CognitoError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await cognitoConfirmSignUp(email, code);
      const tokens = await cognitoLogin(email, password);
      saveTokens(tokens);

      await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });

      await dispatch(initAuth());
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof CognitoError ? err.message : (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="flex flex-1 items-center justify-center p-4">
      <div className="animate-in brut-border brut-shadow-lg w-full max-w-sm bg-card p-8">
        <div className="mb-4 flex justify-center">
          <BrandMark size="lg" />
        </div>
        <h1 className="mb-2 text-center text-4xl font-bold tracking-tight text-ink">
          Foos<span className="text-team-red">Rank</span>
        </h1>
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-wider text-ink-soft">
          {step === "register" ? "Create your account" : "Verify your email"}
        </p>

        {error && (
          <div className="brut-border mb-4 bg-coral px-3 py-2 text-sm font-semibold text-ink">
            {error}
          </div>
        )}

        {step === "register" ? (
          <form onSubmit={handleRegister} className="space-y-4">
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
            <div>
              <label className={labelClass}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                required
                minLength={2}
                maxLength={50}
              />
            </div>
            <div>
              <PasswordInput
                value={password}
                onChange={setPassword}
                label="Password"
                autoComplete="new-password"
                minLength={8}
              />
              <PasswordRules password={password} />
            </div>
            <div>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                label="Confirm Password"
                autoComplete="new-password"
                minLength={8}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs font-semibold text-danger">
                  Passwords do not match
                </p>
              )}
            </div>
            <label className="flex items-start gap-2 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
                required
              />
              <span>
                I have read and accept the{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-ink underline"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>
            <button
              type="submit"
              disabled={loading || !passwordValid || !acceptedPrivacy}
              className="brut-border btn-press brut-shadow min-h-[48px] w-full bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors disabled:cursor-not-allowed disabled:bg-ink-muted"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm font-medium text-ink-soft">
              A verification code was sent to{" "}
              <span className="font-mono font-bold text-ink">{email}</span>
            </p>
            <div>
              <label className={labelClass}>Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`${inputClass} font-mono tracking-[0.3em]`}
                required
                autoComplete="one-time-code"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="brut-border btn-press brut-shadow min-h-[48px] w-full bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors disabled:bg-ink-muted"
            >
              {loading ? "Verifying..." : "Verify & Sign in"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm font-medium text-ink-soft">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-ink underline">
            Sign in
          </Link>
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
};
