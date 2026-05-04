import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";

interface ChangelogEntry {
  version: string;
  date: string;
  summary: string[];
}

interface VersionGroup {
  label: string;
  entries: ChangelogEntry[];
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getMajorMinor = (version: string): string => {
  const parts = version.split(".");
  return `${parts[0]}.${parts[1]}`;
};

const groupByMajorMinor = (entries: ChangelogEntry[]): VersionGroup[] => {
  const groups: VersionGroup[] = [];
  let current: VersionGroup | null = null;

  for (const entry of entries) {
    const label = getMajorMinor(entry.version);
    if (!current || current.label !== label) {
      current = { label, entries: [] };
      groups.push(current);
    }
    current.entries.push(entry);
  }

  return groups;
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

  const groups = useMemo(() => groupByMajorMinor(entries), [entries]);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-ink hover:underline"
        >
          <MdArrowBack size={16} />
          Back to home
        </Link>

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink md:text-4xl">
          What&apos;s New
        </h1>
        <p className="mb-8 text-sm font-medium text-ink-soft">
          A history of updates and improvements to FoosRank.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin border-[3px] border-ink border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm font-medium text-ink-muted">No updates yet.</p>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.label}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="border-2 border-ink bg-butter px-2 py-0.5 font-mono text-base font-bold text-ink">
                    {group.label}
                  </h2>
                  <div className="h-[2px] flex-1 bg-ink" />
                </div>

                <div className="space-y-4">
                  {group.entries.map((entry) => (
                    <div
                      key={entry.version}
                      className="animate-in brut-border brut-shadow bg-card p-5"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <span className="border-2 border-ink bg-lavender px-2 py-0.5 font-mono text-xs font-bold text-ink">
                          v{entry.version}
                        </span>
                        <span className="font-mono text-xs font-semibold text-ink-muted">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {entry.summary.map((item, j) => (
                          <li key={j} className="flex gap-2 text-sm font-medium text-ink-soft">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ink" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
