// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/modules/summary",
        permanent: true, // Use true for permanent redirect (308) or false for temporary (307)
      },
    ];
  },
  experimental: {
    middleware: true,
  },
  productionBrowserSourceMaps: true, // Ensure source maps in production
};

module.exports = nextConfig;
