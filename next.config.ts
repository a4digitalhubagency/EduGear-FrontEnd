import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // The bare domain serves the same app on Railway, but sessions and email links live on www:
      // send anyone who types "edugear.ng" there, keeping the path and query.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'edugear.ng' }],
        destination: 'https://www.edugear.ng/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
