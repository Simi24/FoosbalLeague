import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="text-center">
        <h1 className="mb-4 text-[120px] font-bold leading-none tracking-tight text-ink md:text-[160px]">
          <span className="text-team-blue">4</span>
          <span>0</span>
          <span className="text-team-red">4</span>
        </h1>
        <p className="mb-6 text-sm font-bold uppercase tracking-widest text-ink-soft">
          Page not found
        </p>
        <Link
          to="/dashboard"
          className="brut-border btn-press brut-shadow-lg inline-block min-h-[48px] bg-ink px-6 py-3 text-sm font-bold uppercase tracking-wide text-paper transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};
