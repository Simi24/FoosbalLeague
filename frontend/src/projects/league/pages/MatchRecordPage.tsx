import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "@/api";
import type { LeagueMember } from "../types";

export const MatchRecordPage = () => {
  const { id: leagueId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [team1, setTeam1] = useState<string[]>([]);
  const [team2, setTeam2] = useState<string[]>([]);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!leagueId) return;
    apiFetch(`/leagues/${leagueId}/members`)
      .then((r) => r.json())
      .then(setMembers);
  }, [leagueId]);

  const togglePlayer = (playerId: string, team: 1 | 2) => {
    if (team === 1) {
      setTeam1((prev) =>
        prev.includes(playerId)
          ? prev.filter((p) => p !== playerId)
          : prev.length < 2
            ? [...prev, playerId]
            : prev,
      );
      setTeam2((prev) => prev.filter((p) => p !== playerId));
    } else {
      setTeam2((prev) =>
        prev.includes(playerId)
          ? prev.filter((p) => p !== playerId)
          : prev.length < 2
            ? [...prev, playerId]
            : prev,
      );
      setTeam1((prev) => prev.filter((p) => p !== playerId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (team1.length === 0 || team2.length === 0) {
      setError("Both teams need at least one player");
      return;
    }

    setSubmitting(true);
    const response = await apiFetch("/matches/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        league_id: leagueId,
        team1: { player_ids: team1, score: Number(score1) },
        team2: { player_ids: team2, score: Number(score2) },
      }),
    });

    if (response.ok) {
      navigate(`/leagues/${leagueId}`);
    } else {
      const data = await response.json();
      setError(data.detail || "Failed to record match");
    }
    setSubmitting(false);
  };

  const getPlayerTeam = (pid: string): 0 | 1 | 2 => {
    if (team1.includes(pid)) return 1;
    if (team2.includes(pid)) return 2;
    return 0;
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">
        Record Match
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-6 rounded border border-border bg-bg-secondary p-5">
          <h2 className="mb-3 text-lg font-semibold text-text-primary">
            Select Players
          </h2>
          <div className="space-y-2">
            {members.map((m) => {
              const playerTeam = getPlayerTeam(m.player_id);
              return (
                <div
                  key={m.player_id}
                  className="flex items-center justify-between rounded px-3 py-2 hover:bg-bg-tertiary"
                >
                  <span className="text-sm text-text-primary">
                    {m.display_name}
                    <span className="ml-2 font-mono text-xs text-text-muted">
                      {m.current_elo}
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => togglePlayer(m.player_id, 1)}
                      className={`rounded px-3 py-1 text-xs transition-all ${
                        playerTeam === 1
                          ? "bg-neon-green text-bg-primary"
                          : "border border-border text-text-secondary hover:border-neon-green"
                      }`}
                    >
                      Team 1
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePlayer(m.player_id, 2)}
                      className={`rounded px-3 py-1 text-xs transition-all ${
                        playerTeam === 2
                          ? "bg-neon-green text-bg-primary"
                          : "border border-border text-text-secondary hover:border-neon-green"
                      }`}
                    >
                      Team 2
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">
              Team 1 Score
            </label>
            <input
              type="number"
              min="0"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              className="w-full rounded border border-border bg-bg-tertiary px-3 py-2 text-center font-mono text-2xl text-neon-green outline-none focus:border-neon-green"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">
              Team 2 Score
            </label>
            <input
              type="number"
              min="0"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              className="w-full rounded border border-border bg-bg-tertiary px-3 py-2 text-center font-mono text-2xl text-neon-green outline-none focus:border-neon-green"
              required
            />
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-neon-green px-4 py-3 text-sm font-medium text-bg-primary transition-all hover:bg-neon-green-dim disabled:opacity-50"
        >
          {submitting ? "Recording..." : "Record Match"}
        </button>
      </form>
    </div>
  );
};
