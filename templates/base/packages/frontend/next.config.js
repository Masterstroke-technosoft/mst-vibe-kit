/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["{{PROJECT_NAME}}-shared"],
};

module.exports = nextConfig;
