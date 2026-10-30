import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lead pages read SQLite on each request. Leave Cache Components off so
  // those routes stay ordinary server renders instead of a prerendered shell.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
