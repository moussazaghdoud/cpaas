import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EndpointCard } from "@/components/ui/EndpointCard";

const API_SECTIONS: Record<string, { name: string; description: string }> = {
  authentication: {
    name: "Authentication API",
    description: "Login, logout, JWT token management, and OAuth flows for the Rainbow platform.",
  },
  enduser: {
    name: "Rainbow Enduser Portal API",
    description: "APIs for messaging, presence, contacts, bubbles, channels, file sharing, and more.",
  },
  admin: {
    name: "Rainbow Admin Portal API",
    description: "Company management, user provisioning, organization settings, and system administration.",
  },
  telephony: {
    name: "OXO Connect API",
    description: "PBX integration, call management, and telephony configuration.",
  },
  webrtc: {
    name: "WebRTC Gateway API",
    description: "WebRTC gateway configuration and management.",
  },
  conferencing: {
    name: "Conferencing API",
    description: "Conference management, scheduling, recordings, and participant control.",
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(API_SECTIONS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const api = API_SECTIONS[slug];
  if (!api) return {};
  return { title: api.name, description: api.description };
}

export default async function ApiDetailPage({ params }: Props) {
  const { slug } = await params;
  const api = API_SECTIONS[slug];
  if (!api) notFound();

  // Placeholder — real data comes from crawled OpenAPI specs
  const sampleEndpoints = getSampleEndpoints(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs
        items={[
          { label: "API Reference", href: "/api-reference" },
          { label: api.name },
        ]}
      />

      <div className="max-w-3xl mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-4">{api.name}</h1>
        <p className="text-lg text-muted-foreground">{api.description}</p>
      </div>

      <div className="max-w-3xl space-y-3">
        {sampleEndpoints.map((ep, i) => (
          <EndpointCard key={i} {...ep} />
        ))}
      </div>

      <div className="mt-10 p-4 rounded-lg border border-border text-sm text-muted-foreground max-w-3xl">
        Full endpoint documentation will be populated from the OpenAPI spec after running{" "}
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">pnpm content:sync</code>.
        <br />
        <a
          href={`https://developers.openrainbow.com/doc/rest/api/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline mt-2 inline-block"
        >
          View on Rainbow Developer Hub &rarr;
        </a>
      </div>
    </div>
  );
}

function getSampleEndpoints(slug: string) {
  const samples: Record<string, Array<{ method: "GET" | "POST" | "PUT" | "DELETE"; path: string; summary: string; tags?: string[] }>> = {
    authentication: [
      { method: "GET", path: "/api/rainbow/authentication/v1.0/login", summary: "Login to Rainbow platform", tags: ["auth"] },
      { method: "GET", path: "/api/rainbow/authentication/v1.0/logout", summary: "Logout from Rainbow platform", tags: ["auth"] },
      { method: "GET", path: "/api/rainbow/authentication/v1.0/renew", summary: "Renew JWT authentication token", tags: ["auth"] },
    ],
    enduser: [
      { method: "GET", path: "/api/rainbow/enduser/v1.0/users/{userId}", summary: "Get user information", tags: ["users"] },
      { method: "POST", path: "/api/rainbow/enduser/v1.0/conversations", summary: "Create a conversation", tags: ["messaging"] },
      { method: "POST", path: "/api/rainbow/enduser/v1.0/conversations/{id}/messages", summary: "Send a message in a conversation", tags: ["messaging"] },
      { method: "GET", path: "/api/rainbow/enduser/v1.0/contacts", summary: "List user contacts", tags: ["contacts"] },
      { method: "POST", path: "/api/rainbow/enduser/v1.0/rooms", summary: "Create a bubble (room)", tags: ["bubbles"] },
    ],
    admin: [
      { method: "GET", path: "/api/rainbow/admin/v1.0/companies", summary: "List companies", tags: ["companies"] },
      { method: "POST", path: "/api/rainbow/admin/v1.0/users", summary: "Create a user", tags: ["users"] },
      { method: "PUT", path: "/api/rainbow/admin/v1.0/users/{userId}", summary: "Update a user", tags: ["users"] },
      { method: "DELETE", path: "/api/rainbow/admin/v1.0/users/{userId}", summary: "Delete a user", tags: ["users"] },
    ],
    telephony: [
      { method: "POST", path: "/api/rainbow/telephony/v1.0/calls", summary: "Initiate a phone call", tags: ["calls"] },
      { method: "PUT", path: "/api/rainbow/telephony/v1.0/calls/{callId}", summary: "Update/transfer a call", tags: ["calls"] },
    ],
    webrtc: [
      { method: "GET", path: "/api/rainbow/webrtc/v1.0/conferences", summary: "List WebRTC conferences", tags: ["webrtc"] },
    ],
    conferencing: [
      { method: "POST", path: "/api/rainbow/conferencing/v1.0/conferences", summary: "Create a conference", tags: ["conferences"] },
      { method: "GET", path: "/api/rainbow/conferencing/v1.0/conferences/{id}", summary: "Get conference details", tags: ["conferences"] },
    ],
  };
  return samples[slug] || [];
}
