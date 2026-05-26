import { useNavigate } from "react-router-dom";
import { MdClose, MdRefresh } from "react-icons/md";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { api } from "@/api/baseApi";
import { setUser } from "@/features/auth";

import { exitDemo, resetDemo, selectIsDemoMode } from "./demoSlice";

export const DemoBanner = () => {
  const isDemoMode = useAppSelector(selectIsDemoMode);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  const handleExit = () => {
    dispatch(api.util.resetApiState());
    dispatch(exitDemo());
    dispatch(setUser(null));
    navigate("/", { replace: true });
  };

  const handleReset = () => {
    if (!window.confirm("Reset the demo to its initial state?")) return;
    dispatch(api.util.resetApiState());
    dispatch(resetDemo());
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center gap-2 border-b-2 border-ink bg-butter px-3 py-1.5 md:left-56">
      <span className="brut-border bg-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-paper">
        Demo
      </span>
      <span className="hidden text-xs font-bold uppercase tracking-wide text-ink sm:inline">
        You're playing in a sandbox — nothing is saved.
      </span>
      <span className="text-xs font-bold uppercase tracking-wide text-ink sm:hidden">
        Sandbox — not saved.
      </span>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={handleReset}
          className="btn-press flex items-center gap-1 border-2 border-ink bg-paper px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-paper-alt"
          title="Reset the demo"
        >
          <MdRefresh size={14} />
          <span className="hidden sm:inline">Reset</span>
        </button>
        <button
          type="button"
          onClick={handleExit}
          className="btn-press flex items-center gap-1 border-2 border-ink bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-paper hover:bg-ink-soft"
          title="Exit the demo"
        >
          <MdClose size={14} />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </div>
  );
};
