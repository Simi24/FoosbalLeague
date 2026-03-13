import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth";
import { AppShell } from "@/components/layout";
import { initAuth } from "@/features/auth";
import { CallbackPage } from "@/pages/CallbackPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { LeagueListPage } from "@/projects/league/pages/LeagueListPage";
import { LeagueDetailPage } from "@/projects/league/pages/LeagueDetailPage";
import { MatchRecordPage } from "@/projects/league/pages/MatchRecordPage";
import { LeaderboardPage } from "@/projects/league/pages/LeaderboardPage";
import { PlayerProfilePage } from "@/projects/league/pages/PlayerProfilePage";
import { useAppDispatch, useAppSelector } from "./hooks";

export const App = () => {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (authStatus === "idle") {
      dispatch(initAuth());
    }
  }, [dispatch, authStatus]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/leagues" element={<LeagueListPage />} />
                <Route path="/leagues/:id" element={<LeagueDetailPage />} />
                <Route
                  path="/leagues/:id/match/new"
                  element={<MatchRecordPage />}
                />
                <Route
                  path="/leagues/:id/leaderboard"
                  element={<LeaderboardPage />}
                />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/players/:id" element={<PlayerProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
