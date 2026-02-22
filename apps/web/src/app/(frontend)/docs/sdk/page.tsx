import Link from "next/link";
import type { Metadata } from "next";
import { SDK_LIST } from "@/lib/constants";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "SDKs",
  description: "Rainbow CPaaS SDKs for Node.js, Web, Android, iOS, and C# platforms.",
};

export default function SDKsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs
        items={[
          { label: "Docs", href: "/docs" },
          { label: "SDKs" },
        ]}
      />

      <div className="max-w-2xl mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-4">SDKs</h1>
        <p className="text-lg text-muted-foreground">
          Rainbow provides native SDKs for multiple platforms. Choose the SDK
          that matches your development environment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {SDK_LIST.map((sdk) => (
          <Link
            key={sdk.slug}
            href={`/docs/sdk/${sdk.slug}`}
            className="group flex items-start gap-4 p-6 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all"
          >
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
              {sdk.slug.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-semibold group-hover:text-accent transition-colors">
                {sdk.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{sdk.language}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Installation guides, API reference, and code samples &rarr;
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
