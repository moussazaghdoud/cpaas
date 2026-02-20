/**
 * Shared markdown-to-HTML converter for MDX content.
 * Used by both the docs pages and the CMS live preview.
 */

/** Rewrite legacy portal links to new site paths */
const LINK_REWRITES: Record<string, string> = {
  "/android": "/docs/sdk/android",
  "/ios": "/docs/sdk/ios",
  "/web": "/docs/sdk/web",
  "/webv2": "/docs/sdk/webv2",
  "/node": "/docs/sdk/node",
  "/csharp": "/docs/sdk/csharp",
  "/reactnative": "/docs/sdk/reactnative",
  "/cli": "/docs/sdk/cli",
  "/apis": "/api-reference",
  "/applications": "/portal/applications",
  "/billing": "/portal/billing",
  "/dashboard": "/portal/dashboard",
  "/sandbox": "/portal/sandbox",
  "/home": "/",
  "/pricing": "/docs/hub/application-lifecycle",
  "/profile": "/portal/profile",
};

export function rewriteLink(href: string): string {
  if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return href;
  if (href.startsWith("/static/media/")) return href;
  if (href.startsWith("/docs/") || href.startsWith("/api-reference") || href.startsWith("/portal/") || href.startsWith("/login") || href.startsWith("/signup") || href.startsWith("/support") || href.startsWith("/legal") || href.startsWith("/changelog")) return href;
  if (href.startsWith("/#/documentation/doc/")) return "/docs/" + href.slice(20);
  if (href.startsWith("/#/documentation/")) return "/docs/" + href.slice(17);
  const [path, hash] = href.split("#");
  const suffix = hash ? `#${hash}` : "";
  const target = LINK_REWRITES[path];
  if (target) return target + suffix;
  if (path.startsWith("/doc/")) return "/docs/" + path.slice(5) + suffix;
  if (path.startsWith("doc/")) return "/docs/" + path.slice(4) + suffix;
  if (path.startsWith("/api/")) return "/api-reference" + suffix;
  if (path.startsWith("/enduser/") || path.startsWith("/customercare/")) return "/api-reference" + suffix;
  return href;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Simple markdown-to-HTML converter for the pre-processed MDX content.
 * Handles the most common patterns from our transformer output.
 */
export function markdownToHtml(md: string): string {
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

  // Links — rewrite old portal paths before converting to HTML
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    const rewritten = rewriteLink(href);
    return `<a href="${rewritten}">${text}</a>`;
  });

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
