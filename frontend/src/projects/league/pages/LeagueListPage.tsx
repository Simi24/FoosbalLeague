import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdPeople, MdSportsSoccer } from "react-icons/md";

import { apiFetch } from "@/api";
import type { League } from "../types";

export const LeagueListPage = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    apiFetch("/leagues/")
      .then((r) => r.json())
      .then(setLeagues)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Leagues</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded border border-neon-green px-4 py-2 text-sm text-neon-green transition-all hover:bg-neon-green hover:text-bg-primary"
        >
          <MdAdd size={16} />
          Create League
        </button>
      </div>

      {showCreate && <CreateLeagueForm onCreated={(lg) => {
        setLeagues((prev) => [...prev, lg]);
        setShowCreate(false);
      }} />}

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : leagues.length === 0 ? (
        <p className="text-text-muted">No leagues yet. Create one!</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Link
              key={league.league_id}
              to={`/leagues/${league.league_id}`}
              className="rounded border border-border bg-bg-secondary p-5 transition-all hover:border-neon-green"
            >
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                {league.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <MdPeople size={14} /> {league.member_count}
                </span>
                <span className="flex items-center gap-1">
                  <MdSportsSoccer size={14} /> {league.match_count}
                </span>
                <span className="rounded bg-bg-tertiary px-2 py-0.5 text-xs text-neon-green">
                  {league.league_type}
                </span>
              </div>
              {league.description && (
                <p className="mt-2 text-sm text-text-muted">
                  {league.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateLeagueForm = ({ onCreated }: { onCreated: (lg: League) => void }) => {
  const [name, setName] = useState("");
  const [leagueType, setLeagueType] = useState<"1v1" | "2v2">("2v2");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await apiFetch("/leagues/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, league_type: leagueType, description }),
    });
    if (response.ok) {
      const league = await response.json();
      onCreated(league);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded border border-border bg-bg-secondary p-5">
      <div className="mb-4">
        <label className="mb-1 block text-sm text-text-secondary">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-green"
          required
        />
      </div>
      <div className="mb-4 flex gap-4">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="radio"
            checked={leagueType === "2v2"}
            onChange={() => setLeagueType("2v2")}
            className="accent-neon-green"
          />
          2v2
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="radio"
            checked={leagueType === "1v1"}
            onChange={() => setLeagueType("1v1")}
            className="accent-neon-green"
          />
          1v1
        </label>
      </div>
      <div className="mb-4">
        <label className="mb-1 block text-sm text-text-secondary">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-green"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-neon-green px-4 py-2 text-sm font-medium text-bg-primary transition-all hover:bg-neon-green-dim"
      >
        Create
      </button>
    </form>
  );
};
