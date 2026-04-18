import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn-images.dzcdn.net' },
    ],
  },
  async rewrites() {
    return [
      // User profile URLs live at /@username internally routed to /username.
      { source: '/@:username', destination: '/:username' },
      { source: '/@:username/:path*', destination: '/:username/:path*' },
    ];
  },
};

export default nextConfig;
