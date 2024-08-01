/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["res.cloudinary.com", "tailwindui.com"],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.aquakart.co.in/v1/:path*' // Proxy to Backend
      }
    ];
  }
};

export default nextConfig;