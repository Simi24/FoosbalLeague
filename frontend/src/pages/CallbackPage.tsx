import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { handleCallback } from "@/features/auth";
import { useAppDispatch, useAppSelector } from "@/app/hooks";

export const CallbackPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authStatus = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      dispatch(handleCallback(code));
    } else {
      navigate("/login");
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (authStatus === "succeeded") {
      navigate("/");
    } else if (authStatus === "failed") {
      navigate("/login");
    }
  }, [authStatus, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
        <p className="text-sm text-text-secondary">Signing in...</p>
      </div>
    </div>
  );
};
