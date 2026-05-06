import { useState } from "react";

interface ConfirmDeleteModalProps {
  confirmText: string;
  title: string;
  description: string;
  onConfirm: (reason?: string) => Promise<void>;
  onClose: () => void;
  reasonPresets?: string[];
  reasonPlaceholder?: string;
}

export const ConfirmDeleteModal = ({
  confirmText,
  title,
  description,
  onConfirm,
  onClose,
  reasonPresets,
  reasonPlaceholder,
}: ConfirmDeleteModalProps) => {
  const [input, setInput] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const matches = input === confirmText;
  const showReason = reasonPresets !== undefined;

  const handleConfirm = async () => {
    if (!matches || busy) return;
    setBusy(true);
    try {
      await onConfirm(showReason ? reason.trim() || undefined : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="brut-border brut-shadow-lg w-full max-w-sm bg-card p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-ink">
          {title}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-ink-soft">{description}</p>

        {showReason && (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink">
              Reason (optional)
            </p>
            {reasonPresets && reasonPresets.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {reasonPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className={`brut-border btn-press px-2 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      reason === preset
                        ? "bg-ink text-paper"
                        : "bg-card text-ink hover:bg-paper-alt"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder={reasonPlaceholder ?? "Why is this being deleted?"}
              className="brut-border mb-4 min-h-[44px] w-full bg-card px-3 py-2 text-sm text-ink outline-none"
            />
          </>
        )}

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink">
          Type <span className="font-mono text-ink">{confirmText}</span> to confirm
        </p>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="brut-border mb-4 min-h-[44px] w-full bg-card px-3 py-2 text-sm text-ink outline-none"
          autoFocus
        />
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            onClick={handleConfirm}
            disabled={!matches || busy}
            className="brut-border btn-press min-h-[44px] flex-1 bg-coral px-4 py-2 text-sm font-bold uppercase tracking-wide text-ink transition-colors disabled:cursor-not-allowed disabled:bg-paper-alt disabled:text-ink-muted"
          >
            {busy ? "Deleting..." : "Delete forever"}
          </button>
          <button
            onClick={onClose}
            disabled={busy}
            className="brut-border btn-press min-h-[44px] flex-1 bg-card px-4 py-2 text-sm font-bold uppercase tracking-wide text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
