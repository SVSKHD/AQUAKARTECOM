/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_URL: "https://aquakart.co.in/",
    NEXT_PUBLIC_API_URL: "https://api.aquakart.co.in/v1",
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tailwindui.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.aquakart.co.in/v1/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
