/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during production builds (optional, but helps if there are type issues)
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:9999/auth/:path*',
      },
      {
        source: '/rest/:path*',
        destination: 'http://localhost:3001/rest/:path*',
      },
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  trailingSlash: false,
}

module.exports = nextConfig



