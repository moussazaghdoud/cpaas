import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listContentPages, saveContentPage } from "@/lib/content";
import { getRainbowApiUrl } from "@/lib/rainbow-api";

/** Verify the user is authenticated via rainbow_token cookie */
async function requireAuth(): Promise<{ email: string } | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("rainbow_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiUrl = getRainbowApiUrl();
  const res = await fetch(`${apiUrl}/api/rainbow/enduser/v1.0/users/me`, {
    headers: { accept: "application/json", authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await res.json();
  const email = user.loginEmail || "";

  // Optional: restrict CMS access to specific emails
  const allowed = process.env.CMS_ADMIN_EMAILS;
  if (allowed) {
    const list = allowed.split(",").map((e) => e.trim().toLowerCase());
    if (!list.includes(email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return { email };
}

/** GET /api/cms/pages — list all pages with optional search & type filters */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const search = request.nextUrl.searchParams.get("search")?.toLowerCase() || "";
  const type = request.nextUrl.searchParams.get("type") || "";
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50", 10);

  let pages = listContentPages();

  if (search) {
    pages = pages.filter(
      (p) =>
        p.slug.toLowerCase().includes(search) ||
        (p.meta.title || "").toLowerCase().includes(search)
    );
  }

  if (type) {
    pages = pages.filter((p) => (p.meta.type || "") === type);
  }

  // Sort by title
  pages.sort((a, b) => (a.meta.title || a.slug).localeCompare(b.meta.title || b.slug));

  const total = pages.length;
  const start = (page - 1) * limit;
  const items = pages.slice(start, start + limit).map((p) => ({
    slug: p.slug,
    title: p.meta.title || p.slug,
    type: p.meta.type || "",
    lastSynced: p.meta.lastSynced || "",
  }));

  return NextResponse.json({ items, total, page, limit });
}

/** POST /api/cms/pages — create a new page */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { slug, title, description, type, content } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
  }

  // Check slug format — only alphanumeric, hyphens, underscores, slashes
  if (!/^[a-z0-9/_-]+$/i.test(slug)) {
    return NextResponse.json(
      { error: "Invalid slug: use only letters, numbers, hyphens, underscores, and slashes" },
      { status: 400 }
    );
  }

  // Check if page already exists
  const existing = listContentPages().find((p) => p.slug === slug);
  if (existing) {
    return NextResponse.json({ error: "Page already exists" }, { status: 409 });
  }

  saveContentPage(slug, { title, description, type, source: "cms" }, content || "");

  // Invalidate search index
  const { invalidateSearchIndex } = await import("@/app/api/search/route");
  invalidateSearchIndex();

  return NextResponse.json({ ok: true, slug }, { status: 201 });
}
