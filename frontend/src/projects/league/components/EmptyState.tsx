import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-secondary px-4 py-8 text-center sm:px-6 sm:py-12">
    <div className="mb-3 text-text-muted">{icon}</div>
    <h3 className="mb-1 text-lg font-semibold text-text-primary">{title}</h3>
    {description && <p className="mb-4 text-sm text-text-secondary">{description}</p>}
    {action}
  </div>
);
