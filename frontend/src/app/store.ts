import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";

import { api } from "@/api/baseApi";
import { authSlice, logout } from "@/features/auth";
import { demoSlice } from "@/projects/demo/demoSlice";

const listenerMiddleware = createListenerMiddleware();
listenerMiddleware.startListening({
  actionCreator: logout,
  effect: (_, listenerApi) => {
    listenerApi.dispatch(api.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    demo: demoSlice.reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
