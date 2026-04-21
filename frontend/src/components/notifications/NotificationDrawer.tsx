import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { MdClose, MdExpandLess, MdExpandMore, MdNotificationsOff } from "react-icons/md";

import type { NotificationItem } from "@/api/baseApi";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/api/baseApi";
import { NotificationRow } from "./NotificationRow";

type Props = {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
};

const navigationTargetFor = (n: NotificationItem): string | null => {
  const p = n.payload;
  const leagueId = p.league_id as string | undefined;
  if (!leagueId) return null;

  switch (n.type) {
    case "MATCH_PENDING":
    case "MATCH_CONFIRMED":
    case "MATCH_DISPUTED":
      return `/leagues/${leagueId}`;
    case "ACHIEVEMENT_UNLOCKED":
      return `/profile`;
    default:
      return `/leagues/${leagueId}`;
  }
};

export const NotificationDrawer = ({ open, onClose, notifications }: Props) => {
  const navigate = useNavigate();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [showRead, setShowRead] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowRead(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const { unread, read } = useMemo(() => {
    const u: NotificationItem[] = [];
    const r: NotificationItem[] = [];
    for (const n of notifications) (n.read ? r : u).push(n);
    return { unread: u, read: r };
  }, [notifications]);

  if (!open) return null;

  const handleRowClick = (n: NotificationItem) => {
    if (!n.read) {
      markRead(n.notif_id);
    }
    const target = navigationTargetFor(n);
    onClose();
    if (target) navigate(target);
  };

  const handleMarkAll = () => {
    markAllRead();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-start md:justify-end md:pt-16 md:pr-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className="relative z-10 flex max-h-[85vh] w-full flex-col border-t-[3px] border-ink bg-card md:max-h-[80vh] md:max-w-sm md:border-[3px] md:brut-shadow-lg"
      >
        <header className="flex items-center justify-between border-b-2 border-ink bg-butter px-4 py-3">
          <h2 className="text-base font-bold uppercase tracking-wide text-ink">
            Notifications
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-press border-2 border-transparent p-1 text-ink transition-colors hover:border-ink hover:bg-coral"
          >
            <MdClose size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {unread.length === 0 && !showRead && (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center border-2 border-ink bg-paper-alt text-ink">
                <MdNotificationsOff size={26} />
              </span>
              <p className="text-sm font-bold uppercase tracking-wide text-ink">
                All caught up
              </p>
              <p className="mt-1 text-xs font-medium text-ink-soft">
                No new notifications.
              </p>
            </div>
          )}

          {unread.length > 0 && (
            <div className="divide-y-2 divide-ink/10">
              {unread.map((n) => (
                <NotificationRow
                  key={n.notif_id}
                  notification={n}
                  onClick={() => handleRowClick(n)}
                />
              ))}
            </div>
          )}

          {read.length > 0 && (
            <div className="border-t-2 border-ink/10">
              <button
                type="button"
                onClick={() => setShowRead((v) => !v)}
                className="flex w-full items-center justify-between bg-paper-alt px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-ink-soft transition-colors hover:text-ink"
              >
                <span>
                  {showRead ? "Hide" : "Show"} read ({read.length})
                </span>
                {showRead ? (
                  <MdExpandLess size={18} />
                ) : (
                  <MdExpandMore size={18} />
                )}
              </button>
              {showRead && (
                <div className="divide-y-2 divide-ink/10">
                  {read.map((n) => (
                    <NotificationRow
                      key={n.notif_id}
                      notification={n}
                      onClick={() => handleRowClick(n)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {unread.length > 0 && (
          <footer className="border-t-2 border-ink bg-paper-alt px-4 py-3">
            <button
              type="button"
              onClick={handleMarkAll}
              className="brut-border btn-press min-h-[40px] w-full bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-butter"
            >
              Mark all as read
            </button>
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  );
};
