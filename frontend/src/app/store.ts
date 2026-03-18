import { configureStore } from "@reduxjs/toolkit";

import { authSlice } from "@/features/auth";
import { leaguesSlice } from "@/features/leagues";

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    leagues: leaguesSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
