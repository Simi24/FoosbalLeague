import { useState } from "react";
import { Link } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { apiFetch } from "@/api";
import { initAuth, logout } from "@/features/auth";

export const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const res = await apiFetch("/players/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName }),
    });
    if (res.ok) {
      await dispatch(initAuth());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        Settings
      </h1>

      <div className="brut-border brut-shadow mb-6 bg-card p-5">
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-ink">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink">
              Display Name
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="brut-border min-h-[44px] flex-1 bg-card px-3 py-2 text-sm text-ink outline-none"
                minLength={2}
                maxLength={50}
              />
              <button
                onClick={handleSave}
                disabled={saving || displayName === user?.name || displayName.length < 2}
                className="brut-border btn-press brut-shadow min-h-[44px] w-full bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors disabled:cursor-not-allowed disabled:bg-ink-muted sm:w-auto"
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Save"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between border-t-2 border-ink/10 pt-3 text-sm">
            <span className="font-semibold uppercase tracking-wide text-ink-soft">Email</span>
            <span className="font-medium text-ink">{user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold uppercase tracking-wide text-ink-soft">Player ID</span>
            <span className="font-mono text-xs text-ink-muted">{user?.player_id ?? "Not registered"}</span>
          </div>
        </div>
      </div>

      <div className="border-[3px] border-ink bg-coral p-5">
        <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-ink">Session</h2>
        <button
          onClick={handleLogout}
          className="brut-border btn-press brut-shadow min-h-[44px] bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/changelog"
          className="font-mono text-xs text-ink-muted transition-colors hover:text-ink"
        >
          FoosRank v{__APP_VERSION__}
        </Link>
      </div>
    </div>
  );
};
