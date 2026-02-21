import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Point to the monorepo root so Next.js resolves lockfiles correctly
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // Legacy short SDK paths (old portal)
      { source: "/android", destination: "/docs/sdk/android", permanent: true },
      { source: "/ios", destination: "/docs/sdk/ios", permanent: true },
      { source: "/web", destination: "/docs/sdk/web", permanent: true },
      { source: "/webv2", destination: "/docs/sdk/webv2", permanent: true },
      { source: "/node", destination: "/docs/sdk/node", permanent: true },
      { source: "/csharp", destination: "/docs/sdk/csharp", permanent: true },
      { source: "/reactnative", destination: "/docs/sdk/reactnative", permanent: true },
      { source: "/cli", destination: "/docs/sdk/cli", permanent: true },
      { source: "/apis", destination: "/api-reference", permanent: true },
      { source: "/applications", destination: "/portal/applications", permanent: true },
      { source: "/billing", destination: "/portal/billing", permanent: true },
      { source: "/dashboard", destination: "/portal/dashboard", permanent: true },
      { source: "/sandbox", destination: "/portal/sandbox", permanent: true },
      { source: "/pricing", destination: "/docs/hub/application-lifecycle", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/profile", destination: "/portal/profile", permanent: true },
      // Legacy API doc paths
      { source: "/api/admin/:path*", destination: "/api-reference", permanent: true },
      { source: "/api/authentication/:path*", destination: "/api-reference", permanent: true },
      { source: "/enduser/:path*", destination: "/api-reference", permanent: true },
      { source: "/customercare/:path*", destination: "/api-reference", permanent: true },
      // Legacy /doc/ paths
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
