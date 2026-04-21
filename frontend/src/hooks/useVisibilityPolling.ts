import { useEffect, useState } from "react";

const isDocumentVisible = (): boolean =>
  typeof document === "undefined" || document.visibilityState === "visible";

/**
 * Track `document.visibilityState` and return a polling interval in ms that
 * pauses (0) when the tab is hidden. Pass the result to RTK Query's
 * `pollingInterval` option to stop polling in the background.
 */
export const useVisibilityPolling = (intervalWhenVisibleMs: number): number => {
  const [visible, setVisible] = useState(isDocumentVisible);

  useEffect(() => {
    const handler = () => setVisible(isDocumentVisible());
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return visible ? intervalWhenVisibleMs : 0;
};
