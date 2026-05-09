import { defineConfig } from "vite";

// Pour GitHub Pages : base = "/mort-dans-l-ame-game/" en production.
// En dev (npm run dev) on utilise "/" classique.
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  base: isProd ? "/mort-dans-l-ame-game/" : "/",
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: "es2020",
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
  },
});
