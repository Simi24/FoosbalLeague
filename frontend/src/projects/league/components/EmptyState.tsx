import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="brut-border brut-shadow flex flex-col items-center justify-center bg-card px-4 py-10 text-center sm:px-6 sm:py-14">
    <div className="mb-4 flex h-14 w-14 items-center justify-center border-2 border-ink bg-butter text-ink">
      {icon}
    </div>
    <h3 className="mb-1 text-lg font-bold uppercase tracking-wide text-ink">
      {title}
    </h3>
    {description && (
      <p className="mb-4 max-w-sm text-sm font-medium text-ink-soft">{description}</p>
    )}
    {action}
  </div>
);
