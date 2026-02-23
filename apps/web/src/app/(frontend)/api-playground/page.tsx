import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ApiPlayground } from "@/components/ui/ApiPlayground";
import { getAllPortals } from "@/lib/api-data";

export const metadata: Metadata = {
  title: "API Playground — Rainbow CPaaS",
  description:
    "Test Rainbow REST APIs interactively. Send requests, inspect responses, and explore all 359 endpoints from your browser.",
};

export default function ApiPlaygroundPage() {
  const portals = getAllPortals();

  const endpoints = portals.flatMap((portal) =>
    portal.endpoints.map((ep) => ({
      method: ep.method,
      path: ep.path,
      summary: ep.summary,
      basePath: portal.basePath,
      portalLabel: portal.label,
    }))
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs
        items={[
          { label: "API Reference", href: "/api-reference" },
          { label: "API Playground" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">API Playground</h1>
        <p className="text-lg text-[var(--muted-foreground)]">
          Test Rainbow APIs interactively. Select an endpoint, configure your request, and send it.
        </p>
      </div>

      <ApiPlayground endpoints={endpoints} />
    </div>
  );
}
