import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { loginWithCredentials } from "@/features/auth";
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
      navigate("/");
    } else {
      setError(result.error.message ?? "Login failed");
    }
  };

  const isLoading = authStatus === "loading";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="w-full max-w-sm rounded-xl border border-border bg-bg-secondary p-8 shadow-sm">
        <h1 className="mb-2 text-center text-3xl font-bold text-accent">
          FoosLeague
        </h1>
        <p className="mb-8 text-center text-sm text-text-secondary">
          ELO-based office foosball rankings
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
              autoComplete="email"
            />
          </div>
          <div className="mb-6">
            <PasswordInput
              value={password}
              onChange={setPassword}
              label="Password"
              labelRight={
                <Link to="/forgot-password" className="text-xs text-accent hover:text-accent-hover">
                  Forgot password?
                </Link>
              }
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-accent hover:text-accent-hover">
            Sign up
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-text-muted">
          Internal use only
        </p>
      </div>
    </div>
  );
};
