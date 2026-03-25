import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdInfoOutline } from "react-icons/md";

import { EloInfoContent } from "./EloInfoContent";

export const EloInfoTrigger = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="How ELO ranking works"
    className="inline-flex items-center justify-center rounded-md p-1 text-text-muted transition-colors hover:text-accent"
  >
    <MdInfoOutline size={18} />
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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="How ELO ranking works"
        className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-2xl border-t border-border bg-bg-secondary shadow-2xl md:max-h-[70vh] md:max-w-md md:rounded-xl md:border"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-text-primary">How ELO Works</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-muted transition-colors hover:text-text-primary"
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
