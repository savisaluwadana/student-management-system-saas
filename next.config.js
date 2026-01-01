/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized Docker builds
  output: 'standalone',
  images: {
    domains: [],
  },
}

module.exports = nextConfig
