import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch } from "@/app/hooks";
import { apiFetch } from "@/api";
import {
  isLocalMode,
  cognitoSignUp,
  cognitoConfirmSignUp,
  cognitoLogin,
  CognitoError,
  saveTokens,
  initAuth,
} from "@/features/auth";

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      if (isLocalMode()) {
        const response = await apiFetch("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_name: displayName }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail ?? "Registration failed");
        }
        await dispatch(initAuth());
        navigate("/");
        return;
      }

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="w-full max-w-sm rounded border border-border bg-bg-secondary p-8">
        <h1 className="mb-2 text-center text-3xl font-bold text-neon-green">
          FoosLeague
        </h1>
        <p className="mb-8 text-center text-sm text-text-secondary">
          {step === "register" ? "Create your account" : "Verify your email"}
        </p>

        {error && (
          <div className="mb-4 rounded border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {step === "register" ? (
          <form onSubmit={handleRegister}>
            {!isLocalMode() && (
              <div className="mb-4">
                <label className="mb-1 block text-sm text-text-secondary">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-green"
                  required
                  autoComplete="email"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="mb-1 block text-sm text-text-secondary">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-green"
                required
                minLength={2}
                maxLength={50}
              />
            </div>
            {!isLocalMode() && (
              <>
                <div className="mb-4">
                  <label className="mb-1 block text-sm text-text-secondary">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-green"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="mb-6">
                  <label className="mb-1 block text-sm text-text-secondary">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-green"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded border border-neon-green px-4 py-3 text-sm font-medium text-neon-green transition-all hover:bg-neon-green hover:text-bg-primary disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p className="mb-4 text-sm text-text-secondary">
              A verification code was sent to <span className="text-neon-green">{email}</span>
            </p>
            <div className="mb-6">
              <label className="mb-1 block text-sm text-text-secondary">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-green"
                required
                autoComplete="one-time-code"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded border border-neon-green px-4 py-3 text-sm font-medium text-neon-green transition-all hover:bg-neon-green hover:text-bg-primary disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Sign in"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="text-neon-green hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
