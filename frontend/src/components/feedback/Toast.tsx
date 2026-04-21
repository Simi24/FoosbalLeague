import { MdClose, MdCheckCircle, MdError, MdInfo, MdWarning } from "react-icons/md";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const TOAST_CONFIG: Record<ToastType, { icon: React.ElementType; stripe: string }> = {
  success: { icon: MdCheckCircle, stripe: "bg-mint" },
  error: { icon: MdError, stripe: "bg-coral" },
  info: { icon: MdInfo, stripe: "bg-lavender" },
  warning: { icon: MdWarning, stripe: "bg-butter" },
};

export const Toast = ({ message, type, onClose }: ToastProps) => {
  const { icon: Icon, stripe } = TOAST_CONFIG[type];

  return (
    <div className="brut-border brut-shadow animate-slide-in-right pointer-events-auto flex items-stretch overflow-hidden bg-card">
      <div className={`flex w-10 shrink-0 items-center justify-center border-r-2 border-ink ${stripe}`}>
        <Icon size={20} className="text-ink" />
      </div>
      <p className="flex-1 px-3 py-3 text-sm font-medium text-ink">{message}</p>
      <button
        onClick={onClose}
        className="btn-press shrink-0 border-l-2 border-ink px-3 text-ink transition-colors hover:bg-paper-alt"
        aria-label="Close"
      >
        <MdClose size={16} />
      </button>
    </div>
  );
};
