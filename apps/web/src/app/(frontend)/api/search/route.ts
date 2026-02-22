import { NextRequest, NextResponse } from "next/server";
import MiniSearch from "minisearch";
import * as fs from "fs";
import * as path from "path";
import { getSearchCache, setSearchCache, invalidateSearchIndex } from "@/lib/search-cache";

interface SearchDoc {
  id: string;
  title: string;
  path: string;
  excerpt: string;
  type: string;
  content: string;
}

/** Try to build search index from Payload CMS Pages collection */
async function buildIndexFromPayload(): Promise<SearchDoc[] | null> {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const result = await payload.find({
      collection: "pages",
      limit: 1000,
      pagination: false,
    });

    if (result.docs.length === 0) return null;

    return result.docs.map((doc: Record<string, unknown>) => {
      const slug = doc.slug as string;
      const pagePath = "/" + slug.replace(/^doc\//, "docs/");
      const content = (doc.markdownContent as string) || "";

      return {
        id: slug,
        title: (doc.title as string) || slug,
        path: pagePath,
        excerpt: (doc.description as string) || content.substring(0, 200),
        type: (doc.type as string) || "docs",
        content: content.substring(0, 1000),
      };
    });
  } catch {
    return null;
  }
}

async function getSearchIndex(): Promise<MiniSearch> {
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

  // 1. Try Payload CMS as primary source
  const payloadDocs = await buildIndexFromPayload();
  if (payloadDocs && payloadDocs.length > 0) {
    index.addAll(payloadDocs);
    setSearchCache(index);
    return index;
  }

  // 2. Try to load crawled content documents (file-based fallback)
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

  // 3. Fallback: index the known static pages
  const staticPages: SearchDoc[] = [
    { id: "home", title: "Rainbow CPaaS", path: "/", excerpt: "Add communications to your apps with Rainbow CPaaS", type: "page", content: "Rainbow CPaaS messaging voice video conferencing automation APIs SDKs" },
    { id: "docs", title: "Documentation", path: "/docs", excerpt: "Developer documentation — guides, SDKs, API references", type: "docs", content: "documentation guides SDKs API references getting started" },
    { id: "get-started", title: "Get Started Wizard", path: "/get-started", excerpt: "Interactive setup wizard — pick your goal, choose an SDK, create your first app", type: "guide", content: "getting started wizard onboarding quickstart application API keys credentials setup" },
    { id: "getting-started", title: "Getting Started Guide", path: "/docs/getting-started", excerpt: "Step-by-step guide to create your application and make your first call", type: "guide", content: "getting started quickstart application API keys credentials Node.js SDK REST API" },
    { id: "api-ref", title: "API Reference", path: "/api-reference", excerpt: "Complete REST API documentation for Rainbow services", type: "api", content: "REST API reference authentication enduser admin telephony conferencing" },
    { id: "sdks", title: "SDKs", path: "/docs/sdk", excerpt: "Rainbow SDKs for Node.js, Web, Android, iOS, C#", type: "sdk", content: "SDK Node.js Web Android iOS C# JavaScript TypeScript" },
    { id: "support", title: "Support", path: "/support", excerpt: "Get help with Rainbow CPaaS", type: "page", content: "support help FAQ contact developer hub" },
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

  const index = await getSearchIndex();
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
