/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Add these critical settings for production
  output: 'standalone',  // Required for Docker deployment
  trailingSlash: false,
  reactStrictMode: true,
  swcMinify: true,
  
  images: {
    domains: [
      'encrypted-tbn0.gstatic.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'localhost',
      'getbananalink.com',
      'shutterstock.com',
      '127.0.0.1'  // Add local IP
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
      // Add these for production
      {
        protocol: 'https',
        hostname: 'getbananalink.com',
        pathname: '/thumbnails/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '4000',
        pathname: '/uploads/**',
      },
    ],
    // Disable image optimization for uploads to avoid processing
    unoptimized: true,  // CRITICAL: Disable Next.js image optimization
  },

  async rewrites() {
    // In BOTH development and production, rewrite uploads to backend
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : 'https://getbananalink.com'}/uploads/:path*`,
      },
      {
        source: '/thumbnails/:path*',
        destination: `${process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : 'https://getbananalink.com'}/thumbnails/:path*`,
      },
    ];
  },

  // Add headers for cache control
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
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/thumbnails/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  
  // Webpack config for Docker
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;