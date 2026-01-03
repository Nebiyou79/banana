/* eslint-disable @typescript-eslint/no-explicit-any */
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // REQUIRED for Docker standalone
  output: 'standalone',

  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: false,

  images: {
    unoptimized: true, // IMPORTANT for Docker + external images

    domains: [
      'getbananalink.com',
      'www.getbananalink.com',
      'images.unsplash.com',
      'encrypted-tbn0.gstatic.com',
      'via.placeholder.com',
      'picsum.photos',
      'shutterstock.com',
      'localhost',
      '127.0.0.1',
    ],

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'getbananalink.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'getbananalink.com',
        pathname: '/thumbnails/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  webpack: (config: { resolve: { fallback: { fs: boolean; net: boolean; tls: boolean; }; }; }, { isServer }: any) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
