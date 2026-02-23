import Link from "next/link";
import { cn } from "@/lib/utils";

interface EndpointCardProps {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  tags?: string[];
  basePath?: string;
}

const METHOD_COLORS = {
  GET: "bg-green-500/10 text-green-400 border-green-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  PATCH: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function EndpointCard({ method, path, summary, tags, basePath }: EndpointCardProps) {
  const tryItHref = basePath
    ? `/api-playground?method=${method}&path=${encodeURIComponent(basePath + path)}`
    : null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 text-xs font-bold rounded border",
          METHOD_COLORS[method]
        )}
      >
        {method}
      </span>
      <div className="flex-1 min-w-0">
        <code className="text-sm font-mono text-foreground">{path}</code>
        <p className="text-sm text-muted-foreground mt-0.5">{summary}</p>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {tryItHref && (
        <Link
          href={tryItHref}
          className="shrink-0 self-center text-xs px-2.5 py-1 rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 transition-colors"
        >
          Try it
        </Link>
      )}
    </div>
  );
}
