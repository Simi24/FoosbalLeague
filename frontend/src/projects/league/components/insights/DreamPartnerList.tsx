import { Link } from "react-router-dom";

import { Avatar } from "@/components/Avatar";
import type { DreamPartner } from "../../types";

type Props = {
  partners: DreamPartner[];
};

export const DreamPartnerList = ({ partners }: Props) => (
  <div className="brut-border brut-shadow bg-card p-5">
    <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-ink">
      Dream partners
    </h2>
    {partners.length === 0 ? (
      <p className="text-sm font-medium text-ink-muted">
        No 2v2 matches played yet.
      </p>
    ) : (
      <ul className="divide-y-2 divide-ink/10">
        {partners.map((p) => {
          const pct = Math.round(p.win_rate * 100);
          return (
            <li key={p.partner_id}>
              <Link
                to={`/players/${p.partner_id}`}
                className="flex items-center justify-between gap-3 py-2 transition-colors hover:bg-paper-alt"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={p.partner_name} size="sm" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-ink">
                      {p.partner_name}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                      {p.games} game{p.games === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 font-mono text-xs font-bold">
                  <span className="text-success">{p.wins}W</span>
                  <span className="text-danger">{p.losses}L</span>
                  <span className="w-10 text-right text-ink">{pct}%</span>
                  <div className="h-2 w-16 border-2 border-ink bg-paper-alt">
                    <div
                      className="h-full bg-mint"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);
