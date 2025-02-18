// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/modules/summary",
        permanent: true,
      },
    ];
  },
  productionBrowserSourceMaps: true,
  // Remove the experimental middleware flag completely
  // Add webpack config for source maps
  webpack: (config) => {
    config.devtool = "source-map";
    return config;
  },
};

export default nextConfig;
