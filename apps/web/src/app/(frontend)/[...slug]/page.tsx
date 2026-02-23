import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BlockRenderer } from "@/components/BlockRenderer";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string[] }>;
}

async function getPage(slug: string) {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const result = await payload.find({
      collection: "pages",
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (result.docs.length > 0) return result.docs[0];
  } catch {
    // Payload not available
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const page = await getPage(slugStr);
  if (!page) return {};
  const seo = (page.seo || {}) as Record<string, unknown>;
  return {
    title: (seo.metaTitle as string) || (page.title as string),
    description: (seo.metaDescription as string) || (page.description as string) || "",
  };
}

export default async function CMSPage({ params }: Props) {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const page = await getPage(slugStr);
  if (!page) notFound();

  const title = page.title as string;
  const description = page.description as string | undefined;
  const blocks = page.blocks as Array<{ blockType: string; [key: string]: unknown }> | undefined;
  const markdownContent = page.markdownContent as string | undefined;
  const content = page.content as Record<string, unknown> | undefined;

  // Build breadcrumbs from slug segments
  const segments = slugStr.split("/");
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    ...(i < segments.length - 1
      ? { href: "/" + segments.slice(0, i + 1).join("/") }
      : {}),
  }));

  return (
    <div>
      {/* Header section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="text-3xl font-bold tracking-tight mt-4 mb-2">{title}</h1>
        {description && (
          <p className="text-lg text-[var(--muted-foreground)]">{description}</p>
        )}
      </div>

      {/* Blocks */}
      {blocks && blocks.length > 0 && <BlockRenderer blocks={blocks} />}

      {/* Markdown fallback */}
      {(!blocks || blocks.length === 0) && markdownContent && (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-16">
          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(markdownContent) }}
          />
        </div>
      )}

      {/* Rich text content fallback */}
      {(!blocks || blocks.length === 0) && !markdownContent && content && (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-16">
          <BlockRenderer blocks={[{ blockType: "richContent", content }]} />
        </div>
      )}

      {/* Empty page */}
      {(!blocks || blocks.length === 0) && !markdownContent && !content && (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-16">
          <p className="text-[var(--muted-foreground)]">This page has no content yet.</p>
        </div>
      )}
    </div>
  );
}

// Simple markdown → HTML converter for legacy content
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-[var(--muted)] text-sm font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--accent)] hover:underline">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc list-inside mb-4 space-y-1 text-[var(--muted-foreground)]">$&</ul>')
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-[var(--muted-foreground)]">')
    .replace(/^(?!<)/, '<p class="mb-4 leading-relaxed text-[var(--muted-foreground)]">')
    .replace(/(?!>)$/, "</p>");
}
