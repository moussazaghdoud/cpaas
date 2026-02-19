import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "API Reference",
  description: "Rainbow CPaaS REST API reference — complete endpoint documentation for all Rainbow services.",
};

const API_SECTIONS = [
  {
    name: "Authentication",
    description: "Login, logout, JWT token management, and OAuth flows.",
    slug: "authentication",
    tag: "Core",
  },
  {
    name: "Rainbow Enduser Portal",
    description: "Messaging, presence, contacts, bubbles, channels, file sharing, and more for end users.",
    slug: "enduser",
    tag: "Core",
  },
  {
    name: "Rainbow Admin Portal",
    description: "Company management, user provisioning, organization settings, and system administration.",
    slug: "admin",
    tag: "Admin",
  },
  {
    name: "OXO Connect (Telephony)",
    description: "PBX integration, call management, telephony configuration for OXO systems.",
    slug: "telephony",
    tag: "Telephony",
  },
  {
    name: "WebRTC Gateway",
    description: "WebRTC gateway configuration and management for voice/video communications.",
    slug: "webrtc",
    tag: "Media",
  },
  {
    name: "Conferencing (Rainbow CWC)",
    description: "Conference management, scheduling, recordings, and participant control.",
    slug: "conferencing",
    tag: "Media",
  },
];

export default function ApiReferencePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs items={[{ label: "API Reference" }]} />

      <div className="max-w-2xl mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-4">API Reference</h1>
        <p className="text-lg text-muted-foreground">
          Complete REST API documentation for Rainbow CPaaS services. Each API
          includes endpoint details, request/response schemas, and authentication requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        {API_SECTIONS.map((api) => (
          <Link
            key={api.slug}
            href={`/api-reference/${api.slug}`}
            className="group p-6 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold group-hover:text-accent transition-colors">
                {api.name}
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                {api.tag}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {api.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-xl border border-border bg-card max-w-4xl">
        <h3 className="font-semibold mb-2">OpenAPI Specifications</h3>
        <p className="text-sm text-muted-foreground mb-4">
          All Rainbow APIs are documented using the OpenAPI 3.0 specification.
          After running the content sync pipeline, the specs will be available
          in <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/content/openapi/</code>.
        </p>
        <Link
          href="https://developers.openrainbow.com/doc/rest/api"
          target="_blank"
          className="text-sm text-accent hover:underline"
        >
          View original API docs on Rainbow Developer Hub &rarr;
        </Link>
      </div>
    </div>
  );
}
