import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getContentPage, saveContentPage, deleteContentPage } from "@/lib/content";
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

  const raw = await res.json();
  const user = raw.data || raw;
  const email = (user.loginEmail || "").toLowerCase();

  const allowed = process.env.CMS_ADMIN_EMAILS;
  if (allowed) {
    const list = allowed.split(",").map((e) => e.trim().toLowerCase());
    if (!list.includes(email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return { email };
}

/** Decode the slug from the URL param (slashes encoded as ~) */
function decodeSlug(param: string): string {
  return decodeURIComponent(param).replace(/~/g, "/");
}

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/** GET /api/cms/pages/[slug] — get a single page */
export async function GET(_request: NextRequest, ctx: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { slug: rawSlug } = await ctx.params;
  const slug = decodeSlug(rawSlug);
  const page = getContentPage(slug);

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug: page.slug,
    title: page.meta.title || "",
    description: page.meta.description || "",
    type: page.meta.type || "",
    source: page.meta.source || "",
    lastSynced: page.meta.lastSynced || "",
    content: page.content,
  });
}

/** PUT /api/cms/pages/[slug] — update a page */
export async function PUT(request: NextRequest, ctx: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { slug: rawSlug } = await ctx.params;
  const slug = decodeSlug(rawSlug);

  const existing = getContentPage(slug);
  if (!existing) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const body = await request.json();
  const title = body.title ?? existing.meta.title;
  const description = body.description ?? existing.meta.description;
  const type = body.type ?? existing.meta.type;
  const content = body.content ?? existing.content;

  saveContentPage(slug, { title, description, type, source: existing.meta.source }, content);

  // Invalidate search index
  const { invalidateSearchIndex } = await import("@/lib/search-cache");
  invalidateSearchIndex();

  return NextResponse.json({ ok: true, slug });
}

/** DELETE /api/cms/pages/[slug] — delete a page */
export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { slug: rawSlug } = await ctx.params;
  const slug = decodeSlug(rawSlug);

  const deleted = deleteContentPage(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Invalidate search index
  const { invalidateSearchIndex } = await import("@/lib/search-cache");
  invalidateSearchIndex();

  return NextResponse.json({ ok: true });
}
