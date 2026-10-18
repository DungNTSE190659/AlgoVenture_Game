import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 150,
      awaitWriteFinish: { stabilityThreshold: 250, pollInterval: 50 },
    },
  },
});
