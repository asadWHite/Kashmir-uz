import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow admin image uploads up to 15 MB originals before processing.
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      // If admin pastes external URLs we still serve them safely through
      // next/image when used. No wildcard.
    ],
  },
};

export default nextConfig;
