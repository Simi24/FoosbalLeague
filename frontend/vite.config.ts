/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

function cspPlugin() {
  return {
    name: "inject-csp",
    transformIndexHtml: {
      order: "post" as const,
      handler(html: string) {
        const csp = [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self'",
          "connect-src 'self' https://*.amazonaws.com",
          "img-src 'self' data:",
        ].join("; ");
        return html.replace(
          "</head>",
          `    <meta http-equiv="Content-Security-Policy" content="${csp}" />\n  </head>`,
        );
      },
    },
    apply: "build" as const,
  };
}

function getAppVersion(): string {
  const candidates = [
    path.resolve(__dirname, "../.release-please-manifest.json"),
    path.resolve(__dirname, ".release-please-manifest.json"),
  ];
  for (const p of candidates) {
    try {
      const data = JSON.parse(fs.readFileSync(p, "utf-8"));
      if (data["."]) return data["."];
    } catch { /* not found, try next */ }
  }
  return "dev";
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(getAppVersion()),
  },
  plugins: [react(), tailwindcss(), cspPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:9000",
        changeOrigin: true,
      },
    },
  },
});
