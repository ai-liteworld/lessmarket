import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages project sites are served from https://<user>.github.io/<repo>/,
  // so the build needs to know its own subpath. Local dev is still served
  // from "/". See docs/DEVELOPMENT_PLAN.md for the hosting plan.
  base: command === "build" ? "/lessmarket/" : "/",
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
}));
