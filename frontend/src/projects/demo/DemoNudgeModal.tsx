import { Link } from "react-router-dom";
import { MdClose, MdCelebration } from "react-icons/md";

import { useAppDispatch, useAppSelector } from "@/app/hooks";

import {
  dismissNudge,
  selectIsDemoMode,
  selectMatchesRecordedByUser,
  selectNudgeDismissed,
} from "./demoSlice";

export const DemoNudgeModal = () => {
  const isDemoMode = useAppSelector(selectIsDemoMode);
  const matchesRecorded = useAppSelector(selectMatchesRecordedByUser);
  const dismissed = useAppSelector(selectNudgeDismissed);
  const dispatch = useAppDispatch();

  const open = isDemoMode && matchesRecorded >= 1 && !dismissed;
  if (!open) return null;

  const handleDismiss = () => dispatch(dismissNudge());

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 px-4 pb-24 sm:items-center sm:pb-4"
      onClick={handleDismiss}
    >
      <div
        className="brut-border brut-shadow-lg relative w-full max-w-md bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="btn-press absolute right-3 top-3 border-2 border-ink bg-paper p-1 text-ink"
          aria-label="Dismiss"
        >
          <MdClose size={18} />
        </button>
        <div className="mb-3 flex h-12 w-12 items-center justify-center border-2 border-ink bg-butter text-ink">
          <MdCelebration size={28} />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          Nice match!
        </h2>
        <p className="mb-5 text-sm font-medium leading-relaxed text-ink-soft">
          You just recorded your first match and saw the leaderboard react. This
          is the loop — every match counts, and the rankings adjust automatically.
          Set up a real league for your office in two minutes.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/signup"
            className="brut-border btn-press brut-shadow flex-1 bg-ink px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-paper transition-colors"
          >
            Create my league →
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="brut-border btn-press flex-1 bg-paper-alt px-4 py-3 text-sm font-bold uppercase tracking-wide text-ink transition-colors"
          >
            Keep exploring
          </button>
        </div>
      </div>
    </div>
  );
};
