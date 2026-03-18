import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdArrowBack, MdContentCopy, MdPersonRemove, MdRefresh, MdStar, MdStarBorder, MdDelete } from "react-icons/md";

import { apiFetch } from "@/api";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchMyLeagues, invalidateLeagues } from "@/features/leagues";
import { useMyLeagues } from "@/hooks";
import type { League, LeagueMember } from "../types";

export const LeagueSettingsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { leagues: myLeagues } = useMyLeagues();

  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const inviteCode = myLeagues.find((l) => l.league_id === id)?.invite_code ?? "";

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      apiFetch(`/leagues/${id}`).then((r) => r.json()) as Promise<League>,
      apiFetch(`/leagues/${id}/members`).then((r) => r.json()) as Promise<LeagueMember[]>,
    ])
      .then(([lg, mem]) => {
        setLeague(lg);
        setMembers(mem);
        setName(lg.name);
        setDescription(lg.description);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const currentMember = members.find((m) => m.player_id === user?.player_id);
  const isAdmin = currentMember?.role === "admin";

  const handleSave = async () => {
    await apiFetch(`/leagues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    dispatch(invalidateLeagues());
    dispatch(fetchMyLeagues());
    fetchData();
  };

  const handleKick = async (playerId: string) => {
    await apiFetch(`/leagues/${id}/kick/${playerId}`, { method: "POST" });
    dispatch(invalidateLeagues());
    dispatch(fetchMyLeagues());
    fetchData();
  };

  const handlePromote = async (playerId: string) => {
    await apiFetch(`/leagues/${id}/promote/${playerId}`, { method: "POST" });
    fetchData();
  };

  const handleDemote = async (playerId: string) => {
    await apiFetch(`/leagues/${id}/demote/${playerId}`, { method: "POST" });
    fetchData();
  };

  const handleDelete = async () => {
    await apiFetch(`/leagues/${id}`, { method: "DELETE" });
    dispatch(invalidateLeagues());
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!league || !isAdmin) {
    return <p className="text-danger">Access denied</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(`/leagues/${id}`)}
          className="rounded-lg border border-border p-2 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <MdArrowBack size={18} />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">League Settings</h1>
      </div>

      {/* League Info */}
      <div className="mb-6 rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">League Info</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
          >
            Save
          </button>
        </div>
      </div>

      {/* Invite Code */}
      {inviteCode && (
        <div className="mb-6 rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Invite Code</h2>
          <p className="mb-3 text-sm text-text-secondary">
            Share this code with others so they can join your league.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-lg border border-accent/30 bg-accent-light/30 px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.2em] text-accent sm:text-2xl sm:tracking-[0.3em]">
              {inviteCode}
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(inviteCode)}
                className="rounded-lg border border-border p-3 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                title="Copy code"
              >
                <MdContentCopy size={18} />
              </button>
              <button
                onClick={async () => {
                  const res = await apiFetch(`/leagues/${id}/regenerate-code`, { method: "POST" });
                  if (res.ok) {
                    dispatch(invalidateLeagues());
                    dispatch(fetchMyLeagues());
                  }
                }}
                className="rounded-lg border border-border p-3 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                title="Generate new code"
              >
                <MdRefresh size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="mb-6 rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Members ({members.length})
        </h2>
        <div className="space-y-1">
          {members.map((m) => (
            <div
              key={m.player_id}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-bg-tertiary"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{m.display_name}</span>
                {m.role === "admin" && (
                  <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                    admin
                  </span>
                )}
              </div>
              {m.player_id !== user?.player_id && (
                <div className="flex items-center gap-1">
                  {m.role === "player" ? (
                    <button
                      onClick={() => handlePromote(m.player_id)}
                      className="rounded-lg p-2 text-text-muted transition-colors hover:bg-accent-light hover:text-accent"
                      title="Promote to admin"
                    >
                      <MdStar size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDemote(m.player_id)}
                      className="rounded-lg p-2 text-accent transition-colors hover:bg-accent-light"
                      title="Demote to player"
                    >
                      <MdStarBorder size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleKick(m.player_id)}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    title="Remove from league"
                  >
                    <MdPersonRemove size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border-2 border-danger/30 bg-danger/5 p-5">
        <h2 className="mb-2 text-lg font-semibold text-danger">Danger Zone</h2>
        <p className="mb-4 text-sm text-text-secondary">
          Deleting a league removes all members, matches, and rankings permanently.
        </p>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/80"
        >
          <MdDelete size={16} /> Delete League
        </button>
      </div>
    </div>
  );
};
