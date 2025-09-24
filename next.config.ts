import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin output tracing root to this project (avoid parent lockfile confusion)
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
