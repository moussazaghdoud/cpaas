import { NextRequest, NextResponse } from "next/server";
import MiniSearch from "minisearch";
import * as fs from "fs";
import * as path from "path";
import { getSearchCache, setSearchCache } from "@/lib/search-cache";

interface SearchDoc {
  id: string;
  title: string;
  path: string;
  excerpt: string;
  type: string;
  content: string;
}

function getSearchIndex(): MiniSearch {
  const cached = getSearchCache();
  if (cached) return cached as MiniSearch;

  const index = new MiniSearch<SearchDoc>({
    fields: ["title", "content", "excerpt"],
    storeFields: ["title", "path", "excerpt", "type"],
    searchOptions: {
      boost: { title: 3, excerpt: 1.5 },
      fuzzy: 0.2,
      prefix: true,
    },
  });

  // Try to load crawled content documents (check multiple paths for Railway/Vercel compat)
  const candidates = [
    path.join(process.cwd(), "../../content/search-index/documents.json"),
    path.join(process.cwd(), "../content/search-index/documents.json"),
    path.join(process.cwd(), "content/search-index/documents.json"),
  ];
  const docsPath = candidates.find((p) => fs.existsSync(p)) || candidates[0];
  if (fs.existsSync(docsPath)) {
    try {
      const docs: SearchDoc[] = JSON.parse(fs.readFileSync(docsPath, "utf-8"));
      if (docs.length > 0) {
        index.addAll(docs);
        setSearchCache(index);
        return index;
      }
    } catch {
      // Fall through to built-in pages
    }
  }

  // Fallback: index the known static pages
  const staticPages: SearchDoc[] = [
    { id: "home", title: "Rainbow CPaaS", path: "/", excerpt: "Add communications to your apps with Rainbow CPaaS", type: "page", content: "Rainbow CPaaS messaging voice video conferencing automation APIs SDKs" },
    { id: "docs", title: "Documentation", path: "/docs", excerpt: "Developer documentation — guides, SDKs, API references", type: "docs", content: "documentation guides SDKs API references getting started" },
    { id: "get-started", title: "Get Started Wizard", path: "/get-started", excerpt: "Interactive setup wizard — pick your goal, choose an SDK, create your first app", type: "guide", content: "getting started wizard onboarding quickstart application API keys credentials setup" },
    { id: "getting-started", title: "Getting Started Guide", path: "/docs/getting-started", excerpt: "Step-by-step guide to create your application and make your first call", type: "guide", content: "getting started quickstart application API keys credentials Node.js SDK REST API" },
    { id: "api-ref", title: "API Reference", path: "/api-reference", excerpt: "Complete REST API documentation for Rainbow services", type: "api", content: "REST API reference authentication enduser admin telephony conferencing" },
    { id: "api-auth", title: "Authentication API", path: "/api-reference/authentication", excerpt: "Login, logout, JWT token management", type: "api", content: "authentication login logout JWT OAuth token" },
    { id: "api-enduser", title: "Enduser Portal API", path: "/api-reference/enduser", excerpt: "Messaging, presence, contacts, bubbles", type: "api", content: "enduser messaging presence contacts bubbles channels file sharing conversations" },
    { id: "api-admin", title: "Admin Portal API", path: "/api-reference/admin", excerpt: "Company management, user provisioning", type: "api", content: "admin company management user provisioning organization settings" },
    { id: "sdks", title: "SDKs", path: "/docs/sdk", excerpt: "Rainbow SDKs for Node.js, Web, Android, iOS, C#", type: "sdk", content: "SDK Node.js Web Android iOS C# JavaScript TypeScript" },
    { id: "sdk-node", title: "Node.js SDK", path: "/docs/sdk/node", excerpt: "Rainbow Node.js SDK documentation", type: "sdk", content: "Node.js SDK JavaScript TypeScript npm install rainbow-node-sdk" },
    { id: "sdk-web", title: "Web SDK", path: "/docs/sdk/web", excerpt: "Rainbow Web SDK documentation", type: "sdk", content: "Web SDK JavaScript browser client-side rainbow-web-sdk" },
    { id: "support", title: "Support", path: "/support", excerpt: "Get help with Rainbow CPaaS", type: "page", content: "support help FAQ contact developer hub" },
    { id: "legal", title: "Legal", path: "/legal", excerpt: "Terms of service and privacy policy", type: "page", content: "legal terms privacy policy third-party notices" },
    { id: "changelog", title: "Changelog", path: "/changelog", excerpt: "Latest platform updates and changes", type: "page", content: "changelog release notes updates features fixes" },
  ];

  index.addAll(staticPages);
  setSearchCache(index);
  return index;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const index = getSearchIndex();
  const results = index.search(q).slice(0, 10);

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      title: r.title,
      path: r.path,
      excerpt: r.excerpt,
      type: r.type,
      score: r.score,
    })),
  });
}
