/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Coolify/Docker deployment
  output: 'standalone',
  
  // Disable build-time checks for faster deployments
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Remove experimental features that might cause issues
  experimental: {
    // Ensure consistent builds
    optimizeCss: false,
  },
  
  // Headers for security and CORS (replacing Vercel config)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? 'https://www.healthscribe.pro' : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization'
          }
        ]
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // Only include rewrites if needed for development/local services
  async rewrites() {
    // Only apply these rewrites in development or if explicitly enabled
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_LOCAL_REWRITES === 'true') {
      return [
        {
          source: '/auth/:path*',
          destination: 'http://localhost:9999/auth/:path*',
        },
        {
          source: '/rest/:path*',
          destination: 'http://localhost:3001/rest/:path*',
        }
      ]
    }
    return []
  },
  
  // Ensure no trailing slash issues
  trailingSlash: false,
  
  // Optimize for better performance on VPS
  compress: true,
  poweredByHeader: false,
  
  // Ensure static assets are handled properly
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
}

module.exports = nextConfig



