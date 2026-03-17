import { useState } from "react";

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
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Settings</h1>

      <div className="mb-6 rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Display Name</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                minLength={2}
                maxLength={50}
              />
              <button
                onClick={handleSave}
                disabled={saving || displayName === user?.name || displayName.length < 2}
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 sm:w-auto"
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Save"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Email</span>
            <span className="text-text-primary">{user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Player ID</span>
            <span className="font-mono text-text-muted">{user?.player_id ?? "Not registered"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border-2 border-danger/30 bg-danger/5 p-5">
        <h2 className="mb-2 text-lg font-semibold text-danger">Session</h2>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-danger px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};
