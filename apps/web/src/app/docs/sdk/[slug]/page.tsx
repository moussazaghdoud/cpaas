import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SDK_LIST } from "@/lib/constants";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { listContentPages } from "@/lib/content";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sdk = SDK_LIST.find((s) => s.slug === slug);
  if (!sdk) return {};
  return {
    title: sdk.name,
    description: `Rainbow ${sdk.name} documentation — installation, guides, and API reference for ${sdk.language}.`,
  };
}

interface SdkSection {
  title: string;
  pages: { label: string; href: string }[];
}

function getSdkContent(slug: string): SdkSection[] {
  const pages = listContentPages();
  const prefix = `doc/sdk/${slug}`;

  const matching = pages.filter(
    (p) => p.slug.startsWith(prefix + "/") || p.slug === prefix
  );

  // Group by category
  const guides: SdkSection["pages"] = [];
  const api: SdkSection["pages"] = [];
  const other: SdkSection["pages"] = [];
  let homePage: { label: string; href: string } | null = null;

  const GENERIC_TITLES = new Set([
    "CPaaS SDK for business communication solutions | Rainbow",
    "Rainbow",
    "",
  ]);

  for (const page of matching) {
    const href = "/docs/" + page.slug.replace(/^doc\//, "");
    const rawTitle = page.meta.title;
    const label = (rawTitle && !GENERIC_TITLES.has(rawTitle))
      ? rawTitle
      : page.slug
          .split("/")
          .pop()!
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

    if (page.slug === `doc/sdk/${slug}/home` || page.slug === `doc/sdk/${slug}`) {
      homePage = { label, href };
    } else if (page.slug.includes("/guides/")) {
      guides.push({ label, href });
    } else if (page.slug.includes("/api/")) {
      api.push({ label, href });
    } else {
      other.push({ label, href });
    }
  }

  const sections: SdkSection[] = [];

  if (homePage) {
    sections.push({ title: "Overview", pages: [homePage] });
  }
  if (guides.length > 0) {
    sections.push({ title: "Guides", pages: guides.sort((a, b) => a.label.localeCompare(b.label)) });
  }
  if (api.length > 0) {
    sections.push({ title: "API Reference", pages: api.sort((a, b) => a.label.localeCompare(b.label)) });
  }
  if (other.length > 0) {
    sections.push({ title: "Other", pages: other.sort((a, b) => a.label.localeCompare(b.label)) });
  }

  return sections;
}

export default async function SDKPage({ params }: Props) {
  const { slug } = await params;
  const sdk = SDK_LIST.find((s) => s.slug === slug);
  if (!sdk) notFound();

  const sections = getSdkContent(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs
        items={[
          { label: "Docs", href: "/docs" },
          { label: "SDKs", href: "/docs/sdk" },
          { label: sdk.name },
        ]}
      />

      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-3">{sdk.name}</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Integrate Rainbow communication features into your {sdk.language} applications.
        </p>

        {sections.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            <p>SDK documentation is being migrated. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
                <div className="grid gap-2">
                  {section.pages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm hover:bg-muted/50 transition-colors group"
                    >
                      <span className="group-hover:text-primary transition-colors">
                        {page.label}
                      </span>
                      <span className="text-muted-foreground text-xs">&rarr;</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
