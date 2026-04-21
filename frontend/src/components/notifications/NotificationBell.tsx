import { useState } from "react";
import { MdNotifications } from "react-icons/md";

import { useGetNotificationsQuery } from "@/api/baseApi";
import { useAppSelector } from "@/app/hooks";
import { useVisibilityPolling } from "@/hooks";
import { NotificationDrawer } from "./NotificationDrawer";

const POLL_INTERVAL_MS = 30000;

export const NotificationBell = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const pollingInterval = useVisibilityPolling(POLL_INTERVAL_MS);

  const { data } = useGetNotificationsQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const [open, setOpen] = useState(false);

  if (!isAuthenticated) return null;

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className="btn-press relative border-2 border-transparent p-2 text-ink transition-colors hover:border-ink hover:bg-butter"
      >
        <MdNotifications size={22} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center border-2 border-ink bg-coral px-1 font-mono text-[10px] font-bold text-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <NotificationDrawer
        open={open}
        onClose={() => setOpen(false)}
        notifications={notifications}
      />
    </>
  );
};
