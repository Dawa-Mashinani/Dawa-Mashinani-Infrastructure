import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    // Allow ngrok tunnel hosts (and localhost) to access the dev server.
    // Using `.ngrok-free.dev` lets any ngrok subdomain work without needing to edit this file each time.
    allowedHosts: ["localhost", "0.0.0.0", ".ngrok-free.dev"],
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
