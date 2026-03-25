import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="brand-gradient mb-2 text-6xl font-bold">404</h1>
        <p className="mb-6 text-text-secondary">Page not found</p>
        <Link
          to="/dashboard"
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};
