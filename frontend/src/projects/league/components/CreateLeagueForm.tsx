import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCreateLeagueMutation } from "@/api/baseApi";
import type { League } from "../types";

export const CreateLeagueForm = ({ onCreated }: { onCreated?: (lg: League) => void }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [leagueType, setLeagueType] = useState<"1v1" | "2v2">("2v2");
  const [description, setDescription] = useState("");
  const [createLeague] = useCreateLeagueMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const league = await createLeague({ name, league_type: leagueType, description }).unwrap();
      if (onCreated) onCreated(league);
      navigate(`/leagues/${league.league_id}/settings`);
    } catch {
      // mutation error is available via hook if needed
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-border bg-bg-secondary p-5 shadow-sm">
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-text-secondary">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div className="mb-4 flex gap-4">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="radio"
            checked={leagueType === "2v2"}
            onChange={() => setLeagueType("2v2")}
            className="accent-accent"
          />
          2v2
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="radio"
            checked={leagueType === "1v1"}
            onChange={() => setLeagueType("1v1")}
            className="accent-accent"
          />
          1v1
        </label>
      </div>
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
      >
        Create
      </button>
    </form>
  );
};
