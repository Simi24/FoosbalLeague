import { useAppSelector } from "@/app/hooks";
import { MdPerson } from "react-icons/md";

export const Topbar = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="fixed left-56 right-0 top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-bg-secondary px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary">
          {user?.name ?? "Guest"}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg-tertiary">
          <MdPerson size={16} className="text-neon-green" />
        </div>
      </div>
    </header>
  );
};
