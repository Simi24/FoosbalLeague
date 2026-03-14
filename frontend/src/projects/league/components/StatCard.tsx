type StatCardProps = {
  label: string;
  value: string | number;
  color?: string;
};

export const StatCard = ({ label, value, color = "text-text-primary" }: StatCardProps) => (
  <div className="rounded-xl border border-border bg-bg-secondary p-4">
    <p className="text-xs font-medium text-text-muted">{label}</p>
    <p className={`mt-1 font-mono text-2xl font-semibold ${color}`}>{value}</p>
  </div>
);
