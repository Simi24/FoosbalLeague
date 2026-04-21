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
    "brut-border min-h-[44px] w-full bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted";

  const labelClass =
    "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink";

  return (
    <form
      onSubmit={handleSubmit}
      className="brut-border brut-shadow mb-6 bg-card p-5"
    >
      <div className="mb-4">
        <label className={labelClass}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div className="mb-4">
        <span className={labelClass}>League Type</span>
        <div className="flex gap-2">
          {(["2v2", "1v1"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setLeagueType(t)}
              aria-pressed={leagueType === t}
              className={`brut-border btn-press min-h-[44px] flex-1 px-4 py-2 text-sm font-bold transition-colors ${
                leagueType === t
                  ? "bg-butter text-ink brut-shadow"
                  : "bg-card text-ink-soft hover:bg-paper-alt"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className={labelClass}>Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        className="brut-border btn-press brut-shadow min-h-[44px] w-full bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-paper transition-colors sm:w-auto"
      >
        Create
      </button>
    </form>
  );
};
