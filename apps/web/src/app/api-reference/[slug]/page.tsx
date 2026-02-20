import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EndpointCard } from "@/components/ui/EndpointCard";
import { getApiPortal, getAllPortals } from "@/lib/api-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPortals().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const api = getApiPortal(slug);
  if (!api) return {};
  return {
    title: `${api.label} API — Rainbow CPaaS`,
    description: api.title,
  };
}

export default async function ApiDetailPage({ params }: Props) {
  const { slug } = await params;
  const api = getApiPortal(slug);
  if (!api) notFound();

  // Group endpoints by tag
  const grouped: Record<string, typeof api.endpoints> = {};
  for (const ep of api.endpoints) {
    const tag = ep.tag || "Other";
    if (!grouped[tag]) grouped[tag] = [];
    grouped[tag].push(ep);
  }

  const tagEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs
        items={[
          { label: "API Reference", href: "/api-reference" },
          { label: api.label },
        ]}
      />

      <div className="max-w-3xl mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">{api.label} API</h1>
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] font-mono">
            v{api.version}
          </span>
        </div>
        <p className="text-lg text-[var(--muted-foreground)]">{api.title}</p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-8 text-sm max-w-3xl">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
          <span className="text-[var(--muted-foreground)]">Endpoints:</span>
          <span className="font-semibold">{api.endpointCount}</span>
        </div>
        {Object.entries(api.methodCounts).map(([method, count]) => {
          const colors: Record<string, string> = {
            GET: "text-emerald-400",
            POST: "text-blue-400",
            PUT: "text-amber-400",
            DELETE: "text-red-400",
            PATCH: "text-purple-400",
          };
          return (
            <div
              key={method}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]"
            >
              <span className={colors[method] || ""}>{method}</span>
              <span className="font-semibold">{count}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
          <span className="text-[var(--muted-foreground)]">Tags:</span>
          <span className="font-semibold">{api.tags.length}</span>
        </div>
      </div>

      {/* Base path */}
      {api.basePath && (
        <div className="mb-8 max-w-3xl">
          <div className="text-xs text-[var(--muted-foreground)] mb-1">Base path</div>
          <code className="text-sm bg-[var(--muted)] px-3 py-1.5 rounded font-mono">
            {api.basePath}
          </code>
        </div>
      )}

      {/* Endpoints grouped by tag */}
      <div className="max-w-3xl space-y-10">
        {tagEntries.map(([tag, endpoints]) => (
          <section key={tag}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold">{tag}</h2>
              <span className="text-xs text-[var(--muted-foreground)]">
                {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {endpoints.map((ep, i) => (
                <EndpointCard
                  key={`${ep.method}-${ep.path}-${i}`}
                  method={ep.method}
                  path={ep.path}
                  summary={ep.summary}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Spec info */}
      <div className="mt-12 p-4 rounded-lg border border-[var(--border)] text-sm text-[var(--muted-foreground)] max-w-3xl">
        Spec format: {api.specFormat} &middot; Generated from Rainbow OpenAPI specification
      </div>
    </div>
  );
}
