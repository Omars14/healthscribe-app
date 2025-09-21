/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Exclude auth and rest routes - let Nginx handle these
      {
        source: '/((?!auth|rest).*)',
        destination: '/$1',
      },
    ]
  },
  trailingSlash: false,
}

module.exports = nextConfig



