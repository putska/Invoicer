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
        destination: "/modules/welcome",
        permanent: true,
      },
      {
        source: "/safety",
        destination: "/modules/safety",
        permanent: true,
      },
      {
        source: "/purchasing",
        destination: "/modules/purchasing",
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
