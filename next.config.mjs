/** @type {import('next').NextConfig} */
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  async headers() {
    return [
      // 1) Security + robots headers for all pages
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "index, follow, noai, noimageai" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },

      // 2) Next.js build assets (hashed) => cache 1 year
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // 3) Optional: if you serve assets under /assets (versioned) => cache 1 year
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // 4) Public static files (NOT hashed) => cache 7 days
      // Do it with per-extension routes (Next doesn’t allow (?:png|jpg|...))
      {
        source: "/:path*.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/:path*.jpg",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/:path*.jpeg",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/:path*.webp",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/:path*.gif",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/:path*.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/:path*.ico",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },

      {
        source: "/:path*.woff",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/:path*.woff2",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/:path*.ttf",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/:path*.otf",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
    ];
  },

  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_URL: "https://aquakart.co.in",
    NEXT_PUBLIC_API_URL: "https://api.aquakart.co.in/v1",
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Smaller mobile breakpoints = smaller images served on mobile devices
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "tailwindui.com", pathname: "/**" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  async rewrites() {
    return [
      // Keep invoice authentication on the Next.js server. The generic /api
      // proxy below would otherwise send these BFF requests to Express.
      {
        source: "/invoice-gateway/:path*",
        destination: "/api/invoice-access/:path*",
      },
      {
        source: "/api/:path*",
        destination: "https://api.aquakart.co.in/v1/:path*",
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
