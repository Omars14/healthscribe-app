/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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



