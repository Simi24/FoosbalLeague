import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { isLocalMode, loginWithCredentials, initAuth } from "@/features/auth";

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
      navigate("/");
    } else {
      setError(result.error.message ?? "Login failed");
    }
  };

  const handleLocalLogin = async () => {
    await dispatch(initAuth());
    navigate("/");
  };

  const isLoading = authStatus === "loading";
  const displayError = error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="w-full max-w-sm rounded border border-border bg-bg-secondary p-8">
        <h1 className="mb-2 text-center text-3xl font-bold text-neon-green">
          FoosLeague
        </h1>
        <p className="mb-8 text-center text-sm text-text-secondary">
          ELO-based office foosball rankings
        </p>

        {displayError && (
          <div className="mb-4 rounded border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
            {displayError}
          </div>
        )}

        {isLocalMode() ? (
          <button
            onClick={handleLocalLogin}
            className="flex w-full items-center justify-center gap-2 rounded border border-neon-green px-4 py-3 text-sm font-medium text-neon-green transition-all hover:bg-neon-green hover:text-bg-primary"
          >
            Enter as Local Dev
          </button>
        ) : (
          <form onSubmit={handleLogin}>
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
            <div className="mb-6">
              <label className="mb-1 block text-sm text-text-secondary">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-green"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded border border-neon-green px-4 py-3 text-sm font-medium text-neon-green transition-all hover:bg-neon-green hover:text-bg-primary disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        {!isLocalMode() && (
          <p className="mt-6 text-center text-sm text-text-secondary">
            Don't have an account?{" "}
            <Link to="/signup" className="text-neon-green hover:underline">
              Sign up
            </Link>
          </p>
        )}

        <p className="mt-4 text-center text-xs text-text-muted">
          Internal use only
        </p>
      </div>
    </div>
  );
};
