interface RichContentData {
  content?: unknown;
}

// Recursively render Lexical rich text nodes to HTML-like JSX
function renderNode(node: Record<string, unknown>, index: number): React.ReactNode {
  const { type, children, text, format, tag, url, listType } = node as Record<string, unknown>;
  const kids = Array.isArray(children)
    ? children.map((child, i) => renderNode(child as Record<string, unknown>, i))
    : null;

  // Text node
  if (type === "text" && typeof text === "string") {
    let el: React.ReactNode = text;
    if (typeof format === "number") {
      if (format & 1) el = <strong key={index}>{el}</strong>;
      if (format & 2) el = <em key={index}>{el}</em>;
      if (format & 16) el = <code key={index} className="px-1.5 py-0.5 rounded bg-[var(--muted)] text-sm font-mono">{el}</code>;
    }
    return <span key={index}>{el}</span>;
  }

  // Linebreak
  if (type === "linebreak") return <br key={index} />;

  // Headings
  if (type === "heading") {
    const Tag = (tag as "h1" | "h2" | "h3" | "h4" | "h5" | "h6") || "h2";
    const sizes: Record<string, string> = {
      h1: "text-3xl font-bold mt-8 mb-4",
      h2: "text-2xl font-bold mt-8 mb-3",
      h3: "text-xl font-semibold mt-6 mb-2",
      h4: "text-lg font-semibold mt-4 mb-2",
      h5: "text-base font-semibold mt-4 mb-1",
      h6: "text-sm font-semibold mt-4 mb-1",
    };
    return <Tag key={index} className={sizes[Tag] || ""}>{kids}</Tag>;
  }

  // Paragraph
  if (type === "paragraph") {
    return <p key={index} className="mb-4 leading-relaxed text-[var(--muted-foreground)]">{kids}</p>;
  }

  // Links
  if (type === "link") {
    return (
      <a key={index} href={url as string} className="text-[var(--accent)] hover:underline" target={String(url).startsWith("http") ? "_blank" : undefined} rel={String(url).startsWith("http") ? "noopener noreferrer" : undefined}>
        {kids}
      </a>
    );
  }

  // Lists
  if (type === "list") {
    if (listType === "number") return <ol key={index} className="list-decimal list-inside mb-4 space-y-1 text-[var(--muted-foreground)]">{kids}</ol>;
    return <ul key={index} className="list-disc list-inside mb-4 space-y-1 text-[var(--muted-foreground)]">{kids}</ul>;
  }
  if (type === "listitem") {
    return <li key={index}>{kids}</li>;
  }

  // Quote
  if (type === "quote") {
    return <blockquote key={index} className="border-l-4 border-[var(--accent)] pl-4 my-4 italic text-[var(--muted-foreground)]">{kids}</blockquote>;
  }

  // Fallback: render children in a div
  if (kids) return <div key={index}>{kids}</div>;
  return null;
}

export function RichContent({ data }: { data?: Record<string, unknown> }) {
  const d = (data || {}) as RichContentData;
  const content = d.content as Record<string, unknown> | undefined;

  if (!content) return null;

  // Lexical stores content as { root: { children: [...] } }
  const root = content.root as Record<string, unknown> | undefined;
  const nodes = (root?.children || []) as Record<string, unknown>[];

  if (nodes.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 prose-custom">
        {nodes.map((node, i) => renderNode(node, i))}
      </div>
    </section>
  );
}
