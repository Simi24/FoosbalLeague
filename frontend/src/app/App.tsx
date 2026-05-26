import { useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth";
import { AppShell } from "@/components/layout";
import { initAuth } from "@/features/auth";
import { scheduleTokenRefresh } from "@/features/auth/authSlice";
import {
  DemoBanner,
  DemoBottomCta,
  DemoLauncher,
  DemoNudgeModal,
} from "@/projects/demo";
import { ChangelogPage } from "@/pages/ChangelogPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { HowEloWorksPage } from "@/pages/HowEloWorksPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { ProfileRedirect } from "@/pages/ProfileRedirect";
import { SettingsPage } from "@/pages/SettingsPage";
import { SignupPage } from "@/pages/SignupPage";
import { LeagueListPage } from "@/projects/league/pages/LeagueListPage";
import { LeagueDetailPage } from "@/projects/league/pages/LeagueDetailPage";
import { MatchRecordPage } from "@/projects/league/pages/MatchRecordPage";
import { MatchHistoryPage } from "@/projects/league/pages/MatchHistoryPage";
import { LeagueSettingsPage } from "@/projects/league/pages/LeagueSettingsPage";
import { LeaderboardPage } from "@/projects/league/pages/LeaderboardPage";
import { PlayerProfilePage } from "@/projects/league/pages/PlayerProfilePage";
import { selectIsDemoMode } from "@/projects/demo";
import { useAppDispatch, useAppSelector } from "./hooks";

export const App = () => {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector((state) => state.auth.status);
  const isDemoMode = useAppSelector(selectIsDemoMode);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (authStatus === "idle" && !isDemoMode) {
      dispatch(initAuth());
    }
  }, [dispatch, authStatus, isDemoMode]);

  useEffect(() => {
    if (authStatus === "succeeded" && !isDemoMode) {
      cleanupRef.current?.();
      cleanupRef.current = scheduleTokenRefresh(dispatch);
    }
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [dispatch, authStatus, isDemoMode]);

  return (
    <>
      <DemoBanner />
      <DemoBottomCta />
      <DemoNudgeModal />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/how-elo-works" element={<HowEloWorksPage />} />
        <Route path="/demo" element={<DemoLauncher />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
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
                  <Route path="/players/:id" element={<PlayerProfilePage />} />
                  <Route path="/profile" element={<ProfileRedirect />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};
