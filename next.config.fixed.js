/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/auth/:path*',
          destination: 'http://localhost:9999/auth/:path*',
        },
        {
          source: '/rest/:path*',
          destination: 'http://localhost:3001/rest/:path*',
        },
      ],
      afterFiles: [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ],
    }
  },
  trailingSlash: false,
}

module.exports = nextConfig