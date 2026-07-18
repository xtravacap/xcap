import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Linting runs as its own CI/`npm run lint` step; don't block `next build`.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
