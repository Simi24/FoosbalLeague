import type { ReactNode } from "react";

import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-paper">
      <Sidebar />
      <Topbar />
      <main className="mt-14 p-4 pb-24 md:ml-56 md:p-6 md:pb-6">{children}</main>
      <BottomNav />
    </div>
  );
};
