import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { listContentPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Guides",
  description: "Rainbow CPaaS developer guides — messaging, voice, video, bots, and more.",
};

interface GuideLink {
  title: string;
  href: string;
}

function getGuides(): Record<string, GuideLink[]> {
  const pages = listContentPages();
  const groups: Record<string, GuideLink[]> = {};

  for (const page of pages) {
    // Match any guide content: SDK guides, hub guides, REST guides
    const isGuide =
      page.slug.includes("/guides/") ||
      page.slug.startsWith("doc/hub/") ||
      page.slug.startsWith("doc/rest/");

    if (!isGuide) continue;

    // Skip error pages
    if (page.content.includes("Document introuvable")) continue;

    const href = "/docs/" + page.slug.replace(/^doc\//, "");
    const rawTitle = page.meta.title;
    const isGeneric = !rawTitle || rawTitle.includes("CPaaS SDK") || rawTitle === "Rainbow";
    const title = isGeneric
      ? page.slug
          .split("/")
          .pop()!
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : rawTitle;

    // Determine category from path
    let category = "General";
    if (page.slug.includes("sdk/web")) category = "Web SDK";
    else if (page.slug.includes("sdk/node")) category = "Node.js SDK";
    else if (page.slug.includes("sdk/android")) category = "Android SDK";
    else if (page.slug.includes("sdk/ios")) category = "iOS SDK";
    else if (page.slug.includes("sdk/csharp")) category = "C# SDK";
    else if (page.slug.includes("sdk/reactnative")) category = "React Native SDK";
    else if (page.slug.includes("sdk/webv2")) category = "Web SDK v2";
    else if (page.slug.includes("sdk/cli")) category = "CLI SDK";
    else if (page.slug.includes("sdk/s2s")) category = "S2S Starter Kit";
    else if (page.slug.startsWith("doc/hub/")) category = "Platform Guides";
    else if (page.slug.startsWith("doc/rest/")) category = "REST API Guides";

    if (!groups[category]) groups[category] = [];
    groups[category].push({ title, href });
  }

  // Sort each group
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.title.localeCompare(b.title));
  }

  return groups;
}

export default function GuidesPage() {
  const groups = getGuides();
  const categoryOrder = [
    "Platform Guides",
    "REST API Guides",
    "Node.js SDK",
    "Web SDK",
    "Web SDK v2",
    "Android SDK",
    "iOS SDK",
    "C# SDK",
    "React Native SDK",
    "CLI SDK",
    "S2S Starter Kit",
    "General",
  ];

  const sortedEntries = Object.entries(groups).sort(
    ([a], [b]) =>
      (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
      (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs
        items={[
          { label: "Docs", href: "/docs" },
          { label: "Guides" },
        ]}
      />

      <div className="max-w-2xl mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Guides</h1>
        <p className="text-lg text-muted-foreground">
          Step-by-step tutorials to help you integrate Rainbow communication
          features into your applications.
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        {sortedEntries.map(([category, guides]) => (
          <div key={category}>
            <h2 className="text-lg font-semibold mb-3">{category}</h2>
            <div className="grid gap-2">
              {guides.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm hover:bg-muted/50 transition-colors group"
                >
                  <span className="group-hover:text-primary transition-colors">
                    {guide.title}
                  </span>
                  <span className="text-muted-foreground text-xs">&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {sortedEntries.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No guides available yet.
          </div>
        )}
      </div>
    </div>
  );
}
