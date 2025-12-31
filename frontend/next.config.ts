/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'encrypted-tbn0.gstatic.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'localhost',
      'getbananalink.com',
      'shutterstock.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.shutterstock.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'getbananalink.com',
        pathname: '/uploads/**',
      },
    ],
  },

  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/uploads/:path*',
          destination: 'http://localhost:4000/uploads/:path*',
        },
      ];
    }

    // ⛔ In production, do NOT rewrite uploads
    return [];
  },
};

module.exports = nextConfig;
