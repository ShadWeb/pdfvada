import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  devIndicators: false,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
