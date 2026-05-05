import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { loginWithCredentials } from "@/features/auth";
import { BrandMark, Footer } from "@/components/layout";
import { PasswordInput } from "@/components/inputs/PasswordInput";

export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authStatus = useAppSelector((state) => state.auth.status);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await dispatch(loginWithCredentials({ email, password }));
    if (loginWithCredentials.fulfilled.match(result)) {
      navigate("/dashboard");
    } else {
      setError(result.error.message ?? "Login failed");
    }
  };

  const isLoading = authStatus === "loading";

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
          ELO-based office foosball rankings
        </p>

        {error && (
          <div className="brut-border mb-4 bg-coral px-3 py-2 text-sm font-semibold text-ink">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="brut-border min-h-[44px] w-full bg-card px-3 py-2 text-sm text-ink outline-none"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <PasswordInput
              value={password}
              onChange={setPassword}
              label="Password"
              labelRight={
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold uppercase tracking-wide text-ink hover:underline"
                >
                  Forgot?
                </Link>
              }
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="brut-border btn-press brut-shadow min-h-[48px] w-full bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors disabled:cursor-not-allowed disabled:bg-ink-muted"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-medium text-ink-soft">
          Don't have an account?{" "}
          <Link to="/signup" className="font-bold text-ink underline">
            Sign up
          </Link>
        </p>

        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Internal use only
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
};
