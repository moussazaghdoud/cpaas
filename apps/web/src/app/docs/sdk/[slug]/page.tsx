import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SDK_LIST } from "@/lib/constants";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Callout } from "@/components/ui/Callout";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SDK_LIST.map((sdk) => ({ slug: sdk.slug }));
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

export default async function SDKPage({ params }: Props) {
  const { slug } = await params;
  const sdk = SDK_LIST.find((s) => s.slug === slug);
  if (!sdk) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs
        items={[
          { label: "Docs", href: "/docs" },
          { label: "SDKs", href: "/docs/sdk" },
          { label: sdk.name },
        ]}
      />

      <div className="prose max-w-3xl">
        <h1>{sdk.name}</h1>
        <p>
          The Rainbow {sdk.name} enables you to integrate Rainbow communication
          features into your {sdk.language} applications.
        </p>

        <Callout type="info">
          <p>
            This SDK documentation is sourced from the{" "}
            <a
              href={`https://developers.openrainbow.com/doc/sdk/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Rainbow Developer Hub
            </a>
            . Run <code>pnpm content:sync</code> to refresh the content.
          </p>
        </Callout>

        <h2 id="overview">Overview</h2>
        <p>
          The {sdk.name} provides APIs for:
        </p>
        <ul>
          <li>Instant messaging and chat</li>
          <li>Presence management</li>
          <li>Contact management</li>
          <li>Bubble (group) management</li>
          <li>File sharing</li>
          <li>Conferencing</li>
          <li>Telephony integration</li>
        </ul>

        <h2 id="installation">Installation</h2>
        <p>
          Refer to the platform-specific installation guide on the{" "}
          <a
            href={`https://developers.openrainbow.com/doc/sdk/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            official documentation
          </a>.
        </p>

        <h2 id="guides">Guides</h2>
        <p>
          The SDK includes comprehensive guides covering common use cases.
          After running the content sync pipeline, detailed guides will be
          available here.
        </p>
      </div>
    </div>
  );
}
