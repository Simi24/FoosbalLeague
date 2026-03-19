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
import { PasswordInput } from "@/components/inputs/PasswordInput";
import { PasswordRules, isPasswordValid } from "@/components/inputs/PasswordRules";

type Step = "register" | "verify";

export const SignupPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
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
      navigate("/");
    } catch (err) {
      setError(err instanceof CognitoError ? err.message : (err as Error).message);
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
          {step === "register" ? "Create your account" : "Verify your email"}
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {step === "register" ? (
          <form onSubmit={handleRegister}>
            <div className="mb-4">
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
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-text-secondary">Display Name</label>
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
            <div className="mb-4">
              <PasswordInput
                value={password}
                onChange={setPassword}
                label="Password"
                autoComplete="new-password"
                minLength={8}
              />
              <PasswordRules password={password} />
            </div>
            <div className="mb-6">
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                label="Confirm Password"
                autoComplete="new-password"
                minLength={8}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-danger">Passwords do not match</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !passwordValid}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p className="mb-4 text-sm text-text-secondary">
              A verification code was sent to <span className="font-medium text-accent">{email}</span>
            </p>
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-text-secondary">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={inputClass}
                required
                autoComplete="one-time-code"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Sign in"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
