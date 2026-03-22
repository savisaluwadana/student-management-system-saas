/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized Docker builds
  output: 'standalone',
  images: {
    domains: [],
  },
  eslint: {
    // ESLint errors are checked separately via `npm run lint`; don't block builds
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
