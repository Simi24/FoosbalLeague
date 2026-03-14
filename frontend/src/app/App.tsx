import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth";
import { AppShell } from "@/components/layout";
import { initAuth } from "@/features/auth";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { LeagueListPage } from "@/projects/league/pages/LeagueListPage";
import { LeagueDetailPage } from "@/projects/league/pages/LeagueDetailPage";
import { MatchRecordPage } from "@/projects/league/pages/MatchRecordPage";
import { MatchHistoryPage } from "@/projects/league/pages/MatchHistoryPage";
import { LeagueSettingsPage } from "@/projects/league/pages/LeagueSettingsPage";
import { LeaderboardPage } from "@/projects/league/pages/LeaderboardPage";
import { PlayerProfilePage } from "@/projects/league/pages/PlayerProfilePage";
import { PlayerListPage } from "@/projects/league/pages/PlayerListPage";
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
      <Route path="/signup" element={<SignupPage />} />
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
                  path="/leagues/:id/settings"
                  element={<LeagueSettingsPage />}
                />
                <Route
                  path="/leagues/:id/matches"
                  element={<MatchHistoryPage />}
                />
                <Route
                  path="/leagues/:id/match/new"
                  element={<MatchRecordPage />}
                />
                <Route
                  path="/leagues/:id/leaderboard"
                  element={<LeaderboardPage />}
                />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/players" element={<PlayerListPage />} />
                <Route path="/players/:id" element={<PlayerProfilePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
