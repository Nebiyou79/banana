/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // REQUIRED for Docker standalone
  output: "standalone",

  reactStrictMode: true,

  // ❌ REMOVED: swcMinify (always enabled in Next 15)
  trailingSlash: false,

  images: {
    unoptimized: true, // IMPORTANT for Docker + external images

    domains: [
      "getbananalink.com",
      "www.getbananalink.com",
      "images.unsplash.com",
      "encrypted-tbn0.gstatic.com",
      "via.placeholder.com",
      "picsum.photos",
      "shutterstock.com",
      "localhost",
      "127.0.0.1",
    ],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "getbananalink.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "getbananalink.com",
        pathname: "/thumbnails/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },

  webpack: (config: any, { isServer }: any) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default nextConfig
