import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  serverExternalPackages: [],
  turbopack: {},
  async rewrites() {
    const panelUrl = process.env.PANEL_URL || 'http://localhost:3001';
    return [
      { source: '/panel', destination: `${panelUrl}/panel` },
      { source: '/panel/:path*', destination: `${panelUrl}/panel/:path*` },
    ];
  },
};

export default nextConfig;
