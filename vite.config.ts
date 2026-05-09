import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: true, // expose sur LAN pour test mobile
    port: 5173,
  },
  build: {
    target: "es2020",
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
  },
});
