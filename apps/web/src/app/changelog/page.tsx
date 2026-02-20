import type { Metadata } from "next";
import Link from "next/link";
import { listContentPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Rainbow CPaaS platform changelog — latest updates, new features, and fixes.",
};

function getChangelogs() {
  const pages = listContentPages();
  return pages
    .filter((p) => {
      if (!p.slug.includes("release") && !p.slug.includes("changelog") && !p.slug.includes("CHANGELOG"))
        return false;
      if (p.content.includes("Document introuvable")) return false;
      return true;
    })
    .map((p) => ({
      title:
        p.meta.title ||
        p.slug
          .split("/")
          .pop()!
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/docs/" + p.slug.replace(/^doc\//, ""),
      sdk: extractSdk(p.slug),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function extractSdk(slug: string): string {
  if (slug.includes("sdk/node")) return "Node.js SDK";
  if (slug.includes("sdk/webv2")) return "Web SDK v2";
  if (slug.includes("sdk/web")) return "Web SDK";
  if (slug.includes("sdk/android")) return "Android SDK";
  if (slug.includes("sdk/ios")) return "iOS SDK";
  if (slug.includes("sdk/csharp")) return "C# SDK";
  if (slug.includes("sdk/reactnative")) return "React Native SDK";
  if (slug.includes("sdk/cli")) return "CLI SDK";
  return "Platform";
}

export default function ChangelogPage() {
  const changelogs = getChangelogs();

  // Group by SDK
  const grouped: Record<string, typeof changelogs> = {};
  for (const entry of changelogs) {
    if (!grouped[entry.sdk]) grouped[entry.sdk] = [];
    grouped[entry.sdk].push(entry);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-2xl mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Changelog
        </h1>
        <p className="text-lg text-muted-foreground">
          Latest updates and changes to the Rainbow CPaaS platform and SDKs.
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([sdk, entries]) => (
            <div key={sdk}>
              <h2 className="text-lg font-semibold mb-3">{sdk}</h2>
              <div className="grid gap-2">
                {entries.map((entry) => (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm hover:bg-muted/50 transition-colors group"
                  >
                    <span className="group-hover:text-primary transition-colors">
                      {entry.title}
                    </span>
                    <span className="text-muted-foreground text-xs">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No changelog entries available yet.
          </div>
        )}
      </div>
    </div>
  );
}
