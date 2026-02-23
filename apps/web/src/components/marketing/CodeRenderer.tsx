interface CodeBlockData {
  language?: string;
  code?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export function CodeRenderer({ data }: { data?: Record<string, unknown> }) {
  const d = (data || {}) as CodeBlockData;
  const code = d.code || "";
  const language = d.language || "javascript";
  const title = d.title;
  const showLineNumbers = d.showLineNumbers ?? false;

  if (!code) return null;

  const lines = code.split("\n");

  return (
    <section className="py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Title bar */}
          {title && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--muted)] border-b border-[var(--border)]">
              <span className="text-xs font-mono text-[var(--muted-foreground)]">{title}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{language}</span>
            </div>
          )}
          {!title && (
            <div className="flex items-center px-4 py-2 bg-[var(--muted)] border-b border-[var(--border)]">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{language}</span>
            </div>
          )}
          {/* Code body */}
          <div className="bg-[var(--card)] overflow-x-auto">
            <pre className="p-4 text-sm font-mono text-[var(--foreground)] leading-relaxed">
              {showLineNumbers
                ? lines.map((line, i) => (
                    <div key={i} className="flex">
                      <span className="select-none w-8 shrink-0 text-right pr-4 text-[var(--muted-foreground)]">
                        {i + 1}
                      </span>
                      <span>{line}</span>
                    </div>
                  ))
                : code}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
