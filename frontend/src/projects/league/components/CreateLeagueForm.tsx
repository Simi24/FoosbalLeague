import { useState } from "react";

import { apiFetch } from "@/api";
import type { League } from "../types";

export const CreateLeagueForm = ({ onCreated }: { onCreated: (lg: League) => void }) => {
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
