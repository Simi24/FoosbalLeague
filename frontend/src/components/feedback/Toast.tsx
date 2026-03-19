import { MdClose, MdCheckCircle, MdError, MdInfo, MdWarning } from "react-icons/md";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const TOAST_CONFIG: Record<ToastType, { icon: React.ElementType; border: string; iconColor: string }> = {
  success: { icon: MdCheckCircle, border: "border-success/40", iconColor: "text-success" },
  error: { icon: MdError, border: "border-danger/40", iconColor: "text-danger" },
  info: { icon: MdInfo, border: "border-tertiary/40", iconColor: "text-tertiary" },
  warning: { icon: MdWarning, border: "border-warning/40", iconColor: "text-warning" },
};

export const Toast = ({ message, type, onClose }: ToastProps) => {
  const { icon: Icon, border, iconColor } = TOAST_CONFIG[type];

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-xl border ${border} bg-bg-secondary px-4 py-3 shadow-lg animate-slide-in-right`}
    >
      <Icon size={20} className={iconColor} />
      <p className="flex-1 text-sm text-text-primary">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
      >
        <MdClose size={16} />
      </button>
    </div>
  );
};
