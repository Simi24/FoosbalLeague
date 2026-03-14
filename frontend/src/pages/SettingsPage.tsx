import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth";

export const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Settings</h1>

      <div className="rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Name</span>
            <span className="text-text-primary">{user?.name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Email</span>
            <span className="text-text-primary">{user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Player ID</span>
            <span className="font-mono text-text-muted">{user?.player_id ?? "Not registered"}</span>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <button
            onClick={handleLogout}
            className="rounded-lg border border-danger px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
