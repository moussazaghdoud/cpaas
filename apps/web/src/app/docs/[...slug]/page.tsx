import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listContentPages, getContentPage } from "@/lib/content";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { TableOfContents } from "@/components/docs/TableOfContents";

interface Props {
  params: Promise<{ slug: string[] }>;
}

// Exact paths that have dedicated route files — exclude from catch-all
const EXCLUDED_EXACT = new Set([
  "getting-started",
  "guides",
  "faq",
  "sdk",            // /docs/sdk has its own page.tsx
  "sdk/node",       // /docs/sdk/[slug] handles these
  "sdk/web",
  "sdk/webv2",
  "sdk/android",
  "sdk/ios",
  "sdk/csharp",
  "sdk/reactnative",
  "sdk/cli",
  "sdk/s2s-starterkit-nodejs",
]);

export async function generateStaticParams() {
  try {
    const pages = listContentPages();
    return pages
      .filter((p) => {
        if (!p.slug.startsWith("doc/")) return false;
        const rest = p.slug.replace(/^doc\//, "");
        // Exclude bare "doc" pages that would conflict with /docs
        if (!rest || rest === "") return false;
        // Exclude only exact paths with dedicated pages (not subtrees)
        if (EXCLUDED_EXACT.has(rest)) return false;
        return true;
      })
      .map((p) => {
        const parts = p.slug.replace(/^doc\//, "").split("/");
        return { slug: parts };
      });
  } catch (e) {
    console.error("generateStaticParams error:", e);
    return [];
  }
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
  const page = getContentPage(key);

  if (!page) return { title: "Documentation" };

  return {
    title: page.meta.title || slug[slug.length - 1],
    description: page.meta.description || undefined,
  };
}

export default async function DynamicDocsPage({ params }: Props) {
  const { slug } = await params;
  const key = slugToContentKey(slug);
  const page = getContentPage(key);

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
    </div>
  );
}

/**
 * Simple markdown-to-HTML converter for the pre-processed MDX content.
 * Handles the most common patterns from our transformer output.
 */
function markdownToHtml(md: string): string {
  let html = md;

  // Headings (must come before other line-based rules)
  html = html.replace(/^#### (.+)$/gm, '<h4 id="$1">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 id="$1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 id="$1">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Fix heading IDs (slugify)
  html = html.replace(/id="([^"]+)"/g, (_, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `id="${id}"`;
  });

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr />");

  // Paragraphs (lines not already wrapped in tags)
  html = html.replace(/^(?!<[a-z/])((?!^\s*$).+)$/gm, "<p>$1</p>");

  // Clean up double paragraphs
  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/<\/p>\n<p>/g, "</p>\n<p>");

  // Callout components
  html = html.replace(
    /<Callout type="(\w+)">\n?([\s\S]*?)\n?<\/Callout>/g,
    (_, type, content) => {
      const colors: Record<string, string> = {
        note: "border-blue-500/30 bg-blue-500/5",
        warning: "border-yellow-500/30 bg-yellow-500/5",
        tip: "border-green-500/30 bg-green-500/5",
        danger: "border-red-500/30 bg-red-500/5",
        info: "border-purple-500/30 bg-purple-500/5",
      };
      const cls = colors[type] || colors.note;
      return `<div class="my-4 rounded-lg border-l-4 p-4 ${cls}" role="note"><div class="font-semibold text-sm mb-1">${type.charAt(0).toUpperCase() + type.slice(1)}</div><div class="text-sm">${content}</div></div>`;
    }
  );

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
