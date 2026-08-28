import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    // The page fetches /api/courier/token; server.js signs it. Proxying keeps
    // it same-origin, so there is no CORS to configure.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
