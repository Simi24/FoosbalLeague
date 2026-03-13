import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <Topbar />
      <main className="ml-56 mt-14 p-6">{children}</main>
    </div>
  );
};
