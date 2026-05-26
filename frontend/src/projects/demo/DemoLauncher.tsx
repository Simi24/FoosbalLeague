import { useEffect } from "react";
import { Navigate } from "react-router-dom";

import { useAppDispatch } from "@/app/hooks";
import { setUser } from "@/features/auth";
import { api } from "@/api/baseApi";

import { DEMO_TENANT_ID, DEMO_USER_PLAYER_ID, DEMO_USER_SUB } from "./demoIds";
import { enterDemo } from "./demoSlice";

const DEMO_USER = {
  sub: DEMO_USER_SUB,
  email: "you@demo.foosrank",
  name: "You",
  groups: [],
  tenant_id: DEMO_TENANT_ID,
  player_id: DEMO_USER_PLAYER_ID,
};

export const DemoLauncher = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(api.util.resetApiState());
    dispatch(enterDemo());
    dispatch(setUser(DEMO_USER));
  }, [dispatch]);

  return <Navigate to="/dashboard" replace />;
};
