import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/docs",
    "/docs/getting-started",
    "/docs/guides",
    "/docs/sdk",
    "/docs/sdk/node",
    "/docs/sdk/web",
    "/docs/sdk/android",
    "/docs/sdk/ios",
    "/docs/sdk/csharp",
    "/docs/faq",
    "/api-reference",
    "/api-reference/authentication",
    "/api-reference/enduser",
    "/api-reference/admin",
    "/api-reference/telephony",
    "/api-reference/webrtc",
    "/api-reference/conferencing",
    "/support",
    "/legal",
    "/changelog",
  ];

  return staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1.0 : route.startsWith("/docs") ? 0.8 : 0.6,
  }));
}
