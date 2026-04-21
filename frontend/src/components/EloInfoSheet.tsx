import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdInfoOutline } from "react-icons/md";

import { EloInfoContent } from "./EloInfoContent";

export const EloInfoTrigger = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="How ELO ranking works"
    className="btn-press inline-flex items-center justify-center border-2 border-transparent p-1 text-ink transition-colors hover:border-ink hover:bg-butter"
  >
    <MdInfoOutline size={20} />
  </button>
);

interface EloInfoSheetProps {
  open: boolean;
  onClose: () => void;
}

const EloInfoSheetOverlay = ({ open, onClose }: EloInfoSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="How ELO ranking works"
        className="relative z-10 flex max-h-[85vh] w-full flex-col border-t-[3px] border-ink bg-card md:max-h-[70vh] md:max-w-md md:border-[3px] md:brut-shadow-lg"
      >
        <div className="flex items-center justify-between border-b-2 border-ink px-5 py-4">
          <h2 className="text-lg font-bold uppercase tracking-wide text-ink">
            How ELO Works
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-press border-2 border-transparent p-1 text-ink transition-colors hover:border-ink hover:bg-coral"
            aria-label="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <EloInfoContent />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const EloInfoSheet = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <EloInfoTrigger onClick={() => setOpen(true)} />
      <EloInfoSheetOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
};
