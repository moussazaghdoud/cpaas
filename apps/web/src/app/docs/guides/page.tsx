import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "Guides",
  description: "Rainbow CPaaS developer guides — messaging, voice, video, bots, and more.",
};

const GUIDE_CATEGORIES = [
  {
    title: "Messaging & Chat",
    guides: [
      { title: "Send your first message", href: "/docs/guides/messaging" },
      { title: "Group conversations (Bubbles)", href: "/docs/guides/bubbles" },
      { title: "File sharing", href: "/docs/guides/file-sharing" },
    ],
  },
  {
    title: "Voice & Telephony",
    guides: [
      { title: "Making calls", href: "/docs/guides/voice" },
      { title: "Telephony integration", href: "/docs/guides/telephony" },
    ],
  },
  {
    title: "Conferencing",
    guides: [
      { title: "Video conferencing", href: "/docs/guides/conferencing" },
    ],
  },
  {
    title: "Bots & Automation",
    guides: [
      { title: "Building a bot", href: "/docs/guides/bots" },
      { title: "Webhooks", href: "/docs/guides/webhooks" },
    ],
  },
  {
    title: "Administration",
    guides: [
      { title: "Managing users", href: "/docs/guides/managing-users" },
      { title: "Company provisioning", href: "/docs/guides/company-provisioning" },
    ],
  },
];

export default function GuidesPage() {
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
        {GUIDE_CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-lg font-semibold mb-3">{cat.title}</h2>
            <ul className="space-y-1">
              {cat.guides.map((guide) => (
                <li key={guide.href}>
                  <Link
                    href={guide.href}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 p-4 rounded-lg border border-border text-sm text-muted-foreground max-w-3xl">
        Additional guides will be imported from the source portal after running{" "}
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">pnpm content:sync</code>.
      </div>
    </div>
  );
}
