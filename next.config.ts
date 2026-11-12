import type { NextConfig } from "next";

const adminBackendUrl =
  process.env.ADMIN_BACKEND_INTERNAL_URL || "http://127.0.0.1:6051";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/admin/:path*",
        destination: `${adminBackendUrl}/api/admin/:path*`,
      },
      {
        source: "/health/backend",
        destination: `${adminBackendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
