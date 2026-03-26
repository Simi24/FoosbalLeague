import { Navigate } from "react-router-dom";

import { useAppSelector } from "@/app/hooks";

export const ProfileRedirect = () => {
  const user = useAppSelector((state) => state.auth.user);

  if (!user?.player_id) {
    return <p className="text-text-muted">Player profile not set up yet.</p>;
  }

  return <Navigate to={`/players/${user.player_id}`} replace />;
};
