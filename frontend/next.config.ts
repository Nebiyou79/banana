import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ========== BASIC CONFIG ==========
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  trailingSlash: false,
  output: "standalone", // required for Docker

  // ========== IMAGES ==========
  images: {
    unoptimized: true, // important for Docker + external images
    remotePatterns: [
      { protocol: "https", hostname: "getbananalink.com", pathname: "/uploads/**" },
      { protocol: "https", hostname: "getbananalink.com", pathname: "/thumbnails/**" },
      { protocol: "http", hostname: "localhost", pathname: "/uploads/**" },
      { protocol: "http", hostname: "localhost", pathname: "/thumbnails/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "via.placeholder.com", pathname: "/**" },
    ],
    // Add quality configuration
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Configure allowed qualities
    formats: ['image/webp', 'image/avif'],
    // Add quality configuration
    qualities: [75, 90, 100],
  },

  // ========== CACHE HEADERS ==========
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },

  // ========== EXPERIMENTAL FEATURES ==========
  experimental: {
    scrollRestoration: true,
    workerThreads: false,
    optimizeCss: false,
  },

  // ========== WEBPACK CONFIG ==========
  webpack: (config, { isServer }) => {
    // Minimal adjustments only: fallback and aliases
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        zlib: false,
        http: false,
        https: false,
        child_process: false,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      "@": "./src",
    };

    return config;
  },

  // ========== ENV VARIABLES ==========
  env: {
    NEXT_PUBLIC_VERSION: process.env.npm_package_version || "1.0.0",
  },

  // ========== COMPRESSION ==========
  compress: true,

  // ========== POWERED BY HEADER ==========
  poweredByHeader: false,
};

export default nextConfig;
