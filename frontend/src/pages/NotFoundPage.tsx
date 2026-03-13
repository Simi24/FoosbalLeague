import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-bold text-neon-green">404</h1>
        <p className="mb-6 text-text-secondary">Page not found</p>
        <Link
          to="/"
          className="rounded border border-neon-green px-4 py-2 text-neon-green transition-colors hover:bg-neon-green hover:text-bg-primary"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};
