import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAppSelector } from "@/app/hooks";

type ProtectedRouteProps = {
  children: ReactNode;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, status } = useAppSelector((state) => state.auth);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="mx-auto h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
