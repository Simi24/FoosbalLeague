import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdSearch } from "react-icons/md";

const SWIPE_DISMISS_PX = 100;

export type PickerPlayer = {
  player_id: string;
  display_name: string;
  current_elo: number;
  disabledReason?: string;
};

type SortMode = "alpha" | "elo";

interface Props {
  open: boolean;
  title?: string;
  players: PickerPlayer[];
  onSelect: (playerId: string) => void;
  onDismiss: () => void;
}

export const PlayerPicker = ({
  open,
  title = "Pick a player",
  players,
  onSelect,
  onDismiss,
}: Props) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("alpha");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onDismiss]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? players.filter((p) => p.display_name.toLowerCase().includes(q))
      : players;
    const sorted = [...base].sort((a, b) =>
      sortBy === "alpha"
        ? a.display_name.localeCompare(b.display_name)
        : b.current_elo - a.current_elo,
    );
    return sorted;
  }, [players, query, sortBy]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = t.clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t || touchStartRef.current === null) return;
    const dy = t.clientY - touchStartRef.current;
    if (dy > 0) setDragY(dy);
  };
  const handleTouchEnd = () => {
    if (dragY > SWIPE_DISMISS_PX) onDismiss();
    touchStartRef.current = null;
    setDragY(0);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={
          dragY > 0
            ? { transform: `translateY(${dragY}px)`, transition: "none" }
            : undefined
        }
        className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-2xl border-t border-border bg-bg-secondary shadow-2xl transition-transform md:max-h-[70vh] md:max-w-md md:rounded-xl md:border"
      >
        <div
          className="flex justify-center pt-2 md:hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-hidden="true"
        >
          <span className="h-1 w-10 rounded-full bg-text-muted/40" />
        </div>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close picker"
            className="rounded-md p-1 text-text-muted transition-colors hover:text-text-primary"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2 border-b border-border px-5 py-3 sm:flex-row sm:items-center">
          <label htmlFor="player-picker-search" className="sr-only">
            Search players
          </label>
          <div className="relative flex-1">
            <MdSearch
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              id="player-picker-search"
              type="text"
              placeholder="Search players..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-tertiary py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div
            className="inline-flex overflow-hidden rounded-lg border border-border"
            role="group"
            aria-label="Sort players"
          >
            <button
              type="button"
              aria-pressed={sortBy === "alpha"}
              onClick={() => setSortBy("alpha")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                sortBy === "alpha"
                  ? "bg-accent/20 text-accent"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              A→Z
            </button>
            <button
              type="button"
              aria-pressed={sortBy === "elo"}
              onClick={() => setSortBy("elo")}
              className={`border-l border-border px-3 py-1.5 text-xs transition-colors ${
                sortBy === "elo"
                  ? "bg-accent/20 text-accent"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              ELO
            </button>
          </div>
        </div>

        <ul
          className="flex-1 divide-y divide-border overflow-y-auto"
          role="listbox"
          aria-label="Available players"
        >
          {filtered.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-text-muted">
              {query ? "No players match your search" : "No players available"}
            </li>
          )}
          {filtered.map((p) => {
            const disabled = !!p.disabledReason;
            const accessibleName = disabled
              ? `${p.display_name}, ${p.disabledReason}`
              : p.display_name;
            return (
              <li key={p.player_id}>
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  aria-disabled={disabled}
                  aria-label={accessibleName}
                  disabled={disabled}
                  onClick={() => !disabled && onSelect(p.player_id)}
                  className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors ${
                    disabled
                      ? "cursor-not-allowed text-text-muted opacity-60"
                      : "text-text-primary hover:bg-bg-tertiary"
                  }`}
                >
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{p.display_name}</span>
                    <span className="font-mono text-xs text-text-muted">
                      {p.current_elo}
                    </span>
                  </span>
                  {disabled && (
                    <span className="font-mono text-xs text-text-muted">
                      {p.disabledReason}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
};
