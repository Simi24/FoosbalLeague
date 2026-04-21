import {
  MdCheck,
  MdClose,
  MdEmojiEvents,
  MdNotifications,
  MdSportsSoccer,
} from "react-icons/md";

import type { NotificationItem, NotificationType } from "@/api/baseApi";

type Props = {
  notification: NotificationItem;
  onClick: () => void;
};

const TYPE_STYLE: Record<
  NotificationType,
  { icon: React.ComponentType<{ size?: number }>; fill: string; title: string }
> = {
  MATCH_PENDING: {
    icon: MdSportsSoccer,
    fill: "bg-butter",
    title: "Match awaits your action",
  },
  MATCH_CONFIRMED: {
    icon: MdCheck,
    fill: "bg-mint",
    title: "Match confirmed",
  },
  MATCH_DISPUTED: {
    icon: MdClose,
    fill: "bg-coral",
    title: "Match disputed",
  },
  ACHIEVEMENT_UNLOCKED: {
    icon: MdEmojiEvents,
    fill: "bg-lavender",
    title: "Achievement unlocked!",
  },
};

const relativeTime = (iso: string): string => {
  const then = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - then) / 1000);
  if (Number.isNaN(diff) || diff < 0) return "";
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

const subtitleFor = (n: NotificationItem): string => {
  const p = n.payload;
  const leagueName = (p.league_name as string) ?? "";
  switch (n.type) {
    case "MATCH_PENDING":
      return `${leagueName} · ${p.team1_score}–${p.team2_score}`;
    case "MATCH_CONFIRMED": {
      const delta = typeof p.delta === "number" ? p.delta : 0;
      const won = Boolean(p.won);
      const sign = delta >= 0 ? "+" : "";
      return `${leagueName} · ${won ? "Win" : "Loss"} · ${sign}${delta} ELO`;
    }
    case "MATCH_DISPUTED":
      return `${leagueName} · Match disputed`;
    case "ACHIEVEMENT_UNLOCKED":
      return `${leagueName} · ${p.name ?? p.achievement_type ?? ""}`;
    default:
      return leagueName;
  }
};

export const NotificationRow = ({ notification, onClick }: Props) => {
  const style = TYPE_STYLE[notification.type] ?? {
    icon: MdNotifications,
    fill: "bg-paper-alt",
    title: notification.type,
  };
  const Icon = style.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-paper-alt ${
        notification.read ? "bg-card" : "bg-paper-alt"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink text-ink ${style.fill}`}
        aria-hidden="true"
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`truncate text-sm ${notification.read ? "font-semibold text-ink-soft" : "font-bold text-ink"}`}>
            {style.title}
          </span>
          {!notification.read && (
            <span
              aria-label="Unread"
              className="h-2 w-2 shrink-0 border border-ink bg-team-red"
            />
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs font-medium text-ink-soft">
          {subtitleFor(notification)}
        </span>
        <span className="mt-0.5 block font-mono text-[10px] text-ink-muted">
          {relativeTime(notification.created_at)}
        </span>
      </span>
    </button>
  );
};
