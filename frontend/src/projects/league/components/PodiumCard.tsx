import { MdEmojiEvents } from "react-icons/md";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/Avatar";
import type { RankingEntry } from "../types";

type PodiumCardProps = {
  entry: RankingEntry;
  fill: string;
  emphasize?: boolean;
};

export const PodiumCard = ({ entry, fill, emphasize = false }: PodiumCardProps) => (
  <Link
    to={`/players/${entry.player_id}`}
    className={`brut-border brut-shadow-lg card-interactive animate-in relative block ${fill} ${
      emphasize ? "p-4 sm:p-6" : "p-4"
    }`}
    style={{ animationDelay: `${(entry.rank - 1) * 80}ms` }}
  >
    <div className="flex items-start justify-between gap-2">
      <span
        className={`font-mono font-bold leading-none text-ink ${
          emphasize ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
        }`}
      >
        #{entry.rank}
      </span>
      {entry.rank === 1 && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink bg-card text-ink">
          <MdEmojiEvents size={20} />
        </span>
      )}
    </div>
    <div className="mt-4 flex items-center gap-3">
      <Avatar name={entry.display_name} size={emphasize ? "lg" : "md"} />
      <span className="truncate text-base font-bold text-ink">{entry.display_name}</span>
    </div>
    <div className="mt-3 flex items-baseline gap-2">
      <span
        className={`font-mono font-bold text-ink ${
          emphasize ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
        }`}
      >
        {entry.elo}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">ELO</span>
    </div>
    <div className="mt-2 flex items-center gap-3 font-mono text-xs font-bold">
      <span className="text-success">{entry.wins}W</span>
      <span className="text-danger">{entry.losses}L</span>
      <span className="text-ink-soft">{(entry.win_rate * 100).toFixed(0)}%</span>
    </div>
  </Link>
);
