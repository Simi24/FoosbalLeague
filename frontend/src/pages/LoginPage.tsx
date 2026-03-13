import { useNavigate } from "react-router-dom";

import { isLocalMode, buildLoginUrl } from "@/features/auth";

export const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    console.log(isLocalMode() ? "Local mode: redirecting to home page" : "Redirecting to SSO login");
    if (isLocalMode()) {
      navigate("/");
      return;
    }
    window.location.href = await buildLoginUrl();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="w-full max-w-sm rounded border border-border bg-bg-secondary p-8">
        <h1 className="mb-2 text-center text-3xl font-bold text-neon-green">
          FoosLeague
        </h1>
        <p className="mb-8 text-center text-sm text-text-secondary">
          ELO-based office foosball rankings
        </p>

        <button
          onClick={handleLogin}
          className="flex w-full items-center justify-center gap-2 rounded border border-neon-green px-4 py-3 text-sm font-medium text-neon-green transition-all hover:bg-neon-green hover:text-bg-primary"
        >
          Sign in
        </button>

        <p className="mt-6 text-center text-xs text-text-muted">
          Internal use only
        </p>
      </div>
    </div>
  );
};
