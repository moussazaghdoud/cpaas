import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: ".",
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // Map old Rainbow developer portal URLs to new routes
    return [
      { source: "/doc/hub", destination: "/docs", permanent: true },
      { source: "/doc/sdk/node/:path*", destination: "/docs/sdk/node", permanent: true },
      { source: "/doc/sdk/web/:path*", destination: "/docs/sdk/web", permanent: true },
      { source: "/doc/sdk/android/:path*", destination: "/docs/sdk/android", permanent: true },
      { source: "/doc/sdk/ios/:path*", destination: "/docs/sdk/ios", permanent: true },
      { source: "/doc/sdk/csharp/:path*", destination: "/docs/sdk/csharp", permanent: true },
      { source: "/doc/rest/api/:path*", destination: "/api-reference", permanent: true },
      { source: "/doc/guides/:path*", destination: "/docs/guides", permanent: true },
      { source: "/doc/faq", destination: "/docs/faq", permanent: true },
      { source: "/doc/release-notes", destination: "/changelog", permanent: true },
      { source: "/doc/:path*", destination: "/docs", permanent: false },
    ];
  },
};

export default nextConfig;
