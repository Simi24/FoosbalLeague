import { useMemo } from "react";

import { Dropdown } from "@/components/inputs";
import type { HeadToHead } from "../../types";

type Props = {
  records: HeadToHead[];
  playerName: string;
  opponentId: string;
  onOpponentChange: (id: string) => void;
};

export const HeadToHeadPanel = ({
  records,
  playerName,
  opponentId,
  onOpponentChange,
}: Props) => {
  const options = useMemo(
    () =>
      records.map((r) => ({
        value: r.opponent_id,
        label: `${r.opponent_name} · ${r.games} game${r.games === 1 ? "" : "s"}`,
      })),
    [records],
  );

  const selected = useMemo(
    () => records.find((r) => r.opponent_id === opponentId) ?? null,
    [records, opponentId],
  );

  return (
    <div className="brut-border brut-shadow bg-card p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold uppercase tracking-wide text-ink">
          Head to head
        </h2>
        <Dropdown
          value={opponentId}
          onChange={onOpponentChange}
          options={[
            { value: "", label: "Select opponent..." },
            ...options,
          ]}
          className="w-full sm:w-64"
        />
      </div>

      {records.length === 0 ? (
        <p className="text-sm font-medium text-ink-muted">
          No matches played in this league yet.
        </p>
      ) : !selected ? (
        <p className="text-sm font-medium text-ink-muted">
          Pick an opponent to see the scoreboard.
        </p>
      ) : (
        <Scoreboard
          playerName={playerName}
          opponentName={selected.opponent_name}
          playerWins={selected.wins}
          opponentWins={selected.losses}
          games={selected.games}
          eloSwing={selected.elo_swing}
        />
      )}
    </div>
  );
};

type ScoreboardProps = {
  playerName: string;
  opponentName: string;
  playerWins: number;
  opponentWins: number;
  games: number;
  eloSwing: number;
};

const Scoreboard = ({
  playerName,
  opponentName,
  playerWins,
  opponentWins,
  games,
  eloSwing,
}: ScoreboardProps) => {
  const total = games || 1;
  const bluePct = (playerWins / total) * 100;
  const redPct = (opponentWins / total) * 100;
  const swingSign = eloSwing > 0 ? "+" : "";
  const swingColor =
    eloSwing > 0
      ? "text-team-blue"
      : eloSwing < 0
        ? "text-team-red"
        : "text-ink";

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <div className="brut-border flex-1 bg-team-blue-tint p-3 text-center sm:p-4">
          <span className="block truncate text-[10px] font-bold uppercase tracking-widest text-ink-soft">
            {playerName}
          </span>
          <span className="mt-1 block font-mono text-5xl font-black leading-none text-team-blue sm:text-6xl">
            {playerWins}
          </span>
        </div>
        <div className="flex items-center">
          <span className="font-mono text-4xl font-black leading-none text-ink sm:text-5xl">
            –
          </span>
        </div>
        <div className="brut-border flex-1 bg-team-red-tint p-3 text-center sm:p-4">
          <span className="block truncate text-[10px] font-bold uppercase tracking-widest text-ink-soft">
            {opponentName}
          </span>
          <span className="mt-1 block font-mono text-5xl font-black leading-none text-team-red sm:text-6xl">
            {opponentWins}
          </span>
        </div>
      </div>

      <div className="mt-3 flex h-3 w-full overflow-hidden border-2 border-ink bg-paper-alt">
        <div
          className="h-full transition-all"
          style={{ width: `${bluePct}%`, background: "var(--color-team-blue)" }}
        />
        <div
          className="h-full transition-all"
          style={{ width: `${redPct}%`, background: "var(--color-team-red)" }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="brut-border bg-card p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
            Games
          </p>
          <p className="mt-0.5 font-mono text-xl font-bold text-ink sm:text-2xl">
            {games}
          </p>
        </div>
        <div className="brut-border bg-card p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
            ELO swing
          </p>
          <p className={`mt-0.5 font-mono text-xl font-bold sm:text-2xl ${swingColor}`}>
            {swingSign}
            {eloSwing}
          </p>
        </div>
      </div>
    </div>
  );
};
