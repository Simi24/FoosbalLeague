import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

interface ChangelogEntry {
  version: string;
  date: string;
  summary: string[];
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const ChangelogPage = () => {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/changelog.json")
      .then((res) => res.json())
      .then((data: ChangelogEntry[]) => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent"
        >
          <MdArrowBack size={16} />
          Back to home
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-text-primary">What&apos;s New</h1>
        <p className="mb-8 text-text-secondary">
          A history of updates and improvements to FoosLeague.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-text-muted">No updates yet.</p>
        ) : (
          <div className="space-y-6">
            {entries.map((entry, i) => (
              <div
                key={entry.version}
                className="animate-in rounded-xl border border-border bg-bg-secondary p-5 shadow-sm"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-semibold text-accent">
                    v{entry.version}
                  </span>
                  <span className="text-xs text-text-muted">{formatDate(entry.date)}</span>
                </div>
                <ul className="space-y-1.5">
                  {entry.summary.map((item, j) => (
                    <li key={j} className="flex gap-2 text-sm text-text-secondary">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
