import type { NextConfig } from "next";

const remoteHosts = ["images.unsplash.com", process.env.R2_PUBLIC_URL && new URL(process.env.R2_PUBLIC_URL).hostname].filter(
  (h): h is string => Boolean(h),
);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  images: { remotePatterns: remoteHosts.map((hostname) => ({ protocol: "https", hostname })), formats: ["image/avif", "image/webp"] },
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
