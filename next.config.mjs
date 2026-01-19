/** @type {import('next').NextConfig} */
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: true,
});

const nextConfig = {
  async headers() {
    return [
      // 1) Your existing robots header
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "index, follow, noai, noimageai" },
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
    NEXT_PUBLIC_URL: "https://aquakart.co.in/",
    NEXT_PUBLIC_API_URL: "https://api.aquakart.co.in/v1",
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "tailwindui.com", pathname: "/**" },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.aquakart.co.in/v1/:path*",
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
