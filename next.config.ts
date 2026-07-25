import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Point turbopack to the correct root to avoid lockfile confusion
  turbopack: {
    root: __dirname,
  },
  // Speed up development
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg'],
};

export default nextConfig;
