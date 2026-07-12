import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "",
  },
};

export default nextConfig;
