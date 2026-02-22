import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getAllPortals } from "@/lib/api-data";

export const metadata: Metadata = {
  title: "API Reference",
  description: "Rainbow CPaaS REST API reference — complete endpoint documentation for all Rainbow services.",
};

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400",
  POST: "text-blue-400",
  PUT: "text-amber-400",
  DELETE: "text-red-400",
  PATCH: "text-purple-400",
};

export default function ApiReferencePage() {
  const portals = getAllPortals();
  const totalEndpoints = portals.reduce((s, p) => s + p.endpointCount, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs items={[{ label: "API Reference" }]} />

      <div className="max-w-2xl mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-4">API Reference</h1>
        <p className="text-lg text-[var(--muted-foreground)]">
          Complete REST API documentation for Rainbow CPaaS services.
          {totalEndpoints > 0 && (
            <> <span className="text-[var(--accent)] font-semibold">{totalEndpoints}</span> endpoints across{" "}
            <span className="text-[var(--accent)] font-semibold">{portals.length}</span> APIs.</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        {portals.map((api) => (
          <Link
            key={api.slug}
            href={`/api-reference/${api.slug}`}
            className="group p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold group-hover:text-[var(--accent)] transition-colors">
                {api.label}
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
                {api.category}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-3">
              {api.title}
            </p>
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span>{api.endpointCount} endpoints</span>
              <span className="text-[var(--border)]">|</span>
              <span>v{api.version}</span>
              <span className="text-[var(--border)]">|</span>
              <span className="flex gap-1.5">
                {Object.entries(api.methodCounts).map(([m, count]) => (
                  <span key={m} className={METHOD_COLORS[m] || ""}>
                    {count} {m}
                  </span>
                ))}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] max-w-4xl">
        <h3 className="font-semibold mb-2">Base URLs</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          All APIs are accessible over HTTPS with JWT authentication.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="text-xs bg-[var(--muted)] p-2 rounded font-mono">
            <span className="text-[var(--muted-foreground)]">Production:</span>{" "}
            https://openrainbow.com
          </div>
          <div className="text-xs bg-[var(--muted)] p-2 rounded font-mono">
            <span className="text-[var(--muted-foreground)]">Sandbox:</span>{" "}
            https://sandbox.openrainbow.com
          </div>
        </div>
      </div>
    </div>
  );
}
