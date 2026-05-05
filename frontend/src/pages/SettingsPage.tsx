import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { apiFetch } from "@/api";
import { ConfirmDeleteModal, useToast } from "@/components/feedback";
import { initAuth, logout } from "@/features/auth";

export const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await apiFetch("/auth/me/export");
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") ?? "60";
        addToast(`Please wait ${retryAfter}s before exporting again`, "warning");
        return;
      }
      if (!res.ok) {
        addToast("Failed to export your data", "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foosrank-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("Data exported", "success");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    const res = await apiFetch("/auth/me", { method: "DELETE" });
    if (!res.ok) {
      addToast("Failed to delete account", "error");
      return;
    }
    setShowDeleteModal(false);
    addToast("Account deleted", "success");
    dispatch(logout());
    navigate("/", { replace: true });
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

      <div className="brut-border brut-shadow mb-6 bg-card p-5">
        <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-ink">
          Privacy & Data
        </h2>
        <p className="mb-4 text-xs text-ink-soft">
          Your rights under GDPR. See the{" "}
          <Link to="/privacy" className="font-bold text-ink underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="brut-border btn-press brut-shadow min-h-[44px] w-full bg-card px-4 py-2 text-sm font-bold uppercase tracking-wide text-ink transition-colors disabled:cursor-not-allowed disabled:bg-paper-alt sm:w-auto"
        >
          {exporting ? "Exporting..." : "Export my data"}
        </button>
      </div>

      <div className="brut-border mb-6 bg-coral p-5">
        <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-ink">
          Danger zone
        </h2>
        <p className="mb-4 text-xs text-ink">
          Permanently delete your account. Identifying data is removed; historical
          matches are anonymized to preserve other players' leagues.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="brut-border btn-press brut-shadow min-h-[44px] bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
        >
          Delete my account
        </button>
      </div>

      <div className="brut-border bg-card p-5">
        <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-ink">Session</h2>
        <button
          onClick={handleLogout}
          className="brut-border btn-press brut-shadow min-h-[44px] bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
        >
          Sign out
        </button>
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          confirmText="DELETE"
          title="Delete account?"
          description="This permanently removes your profile, email, and login. Historical matches will be anonymized but stay in their leagues. This cannot be undone."
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

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
