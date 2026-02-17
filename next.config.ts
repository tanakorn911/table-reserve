import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  // ซ่อน X-Powered-By header เพื่อไม่ให้ expose ว่าใช้ Next.js
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'img.rocket.new',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/landing-page',
        permanent: false,
      },
    ];
  },
  // Security Headers — เพิ่ม HTTP headers ป้องกันการโจมตีพื้นฐาน
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  // Enable Turbopack configuration
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
