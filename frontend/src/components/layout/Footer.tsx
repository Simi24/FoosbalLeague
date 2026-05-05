import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="px-4 py-4 text-center font-mono text-[10px] uppercase tracking-wider text-ink-muted">
    <Link to="/privacy" className="transition-colors hover:text-ink">
      Privacy
    </Link>
    <span className="mx-2">·</span>
    <Link to="/changelog" className="transition-colors hover:text-ink">
      v{__APP_VERSION__}
    </Link>
  </footer>
);
