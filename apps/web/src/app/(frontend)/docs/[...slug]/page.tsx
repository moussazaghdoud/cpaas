import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContentPageAsync, getContentPage } from "@/lib/content";
import { markdownToHtml } from "@/lib/markdown";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { CmsEditButton } from "@/components/docs/CmsEditButton";

// Force dynamic rendering — avoids pre-rendering 500+ pages at build time
// and ensures CMS edits appear immediately
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string[] }>;
}

function slugToContentKey(slugParts: string[]): string {
  return "doc__" + slugParts.join("__");
}

function buildBreadcrumbs(slugParts: string[]) {
  const items: Array<{ label: string; href?: string }> = [
    { label: "Docs", href: "/docs" },
  ];

  // Build intermediate breadcrumbs
  for (let i = 0; i < slugParts.length; i++) {
    const part = slugParts[i];
    const label = part
      .replace(/^\d+_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    if (i < slugParts.length - 1) {
      items.push({
        label,
        href: "/docs/" + slugParts.slice(0, i + 1).join("/"),
      });
    } else {
      items.push({ label });
    }
  }

  return items;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const key = slugToContentKey(slug);

  // Try async (Payload first, then file fallback)
  const page = await getContentPageAsync(key);

  if (!page) return { title: "Documentation" };

  return {
    title: page.meta.title || slug[slug.length - 1],
    description: page.meta.description || undefined,
  };
}

export default async function DynamicDocsPage({ params }: Props) {
  const { slug } = await params;
  const key = slugToContentKey(slug);

  // Dual-read: try Payload CMS first, then fall back to MDX files
  const page = await getContentPageAsync(key);

  if (!page) {
    notFound();
  }

  const breadcrumbs = buildBreadcrumbs(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex gap-10">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Breadcrumbs items={breadcrumbs} />

          <article className="prose">
            {page.meta.title &&
              !page.meta.title.includes("CPaaS SDK") &&
              page.meta.title !== "Rainbow" && (
              <h1>{page.meta.title}</h1>
            )}

            {/* Render MDX content as HTML (pre-converted markdown) */}
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(page.content) }} />

            {/* Last updated */}
            {page.meta.lastSynced && (
              <div className="mt-12 pt-6 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Last updated on {new Date(page.meta.lastSynced).toLocaleDateString()}.
                </p>
              </div>
            )}
          </article>
        </div>

        {/* Table of contents */}
        <TableOfContents />
      </div>

      {/* Floating edit button — only visible to CMS admins */}
      <CmsEditButton slug={page.slug} />
    </div>
  );
}
