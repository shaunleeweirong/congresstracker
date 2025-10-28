import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: 'output: standalone' is for Docker/self-hosted deployments
  // Vercel uses serverless functions by default, so we don't need it

  // Disable telemetry in production
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
};

export default nextConfig;
