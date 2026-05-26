import { Link } from "react-router-dom";

import { useAppSelector } from "@/app/hooks";

import { selectIsDemoMode } from "./demoSlice";

export const DemoBottomCta = () => {
  const isDemoMode = useAppSelector(selectIsDemoMode);
  if (!isDemoMode) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t-2 border-ink bg-mint px-4 py-2 md:bottom-0 md:left-56">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <p className="text-xs font-bold text-ink sm:text-sm">
          Like what you see?
        </p>
        <Link
          to="/signup"
          className="brut-border btn-press min-h-[36px] bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-paper transition-colors"
        >
          Create your league →
        </Link>
      </div>
    </div>
  );
};
