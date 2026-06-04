/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves this project under https://<user>.github.io/skyjo/, so the
// production build needs base "/skyjo/" for assets to resolve. Local dev serves
// from "/". Override the build base with BASE_PATH (e.g. "/" for a custom domain).
export default defineConfig(({ command }) => ({
  base: command === "build" ? (process.env.BASE_PATH ?? "/skyjo/") : "/",
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
}));
