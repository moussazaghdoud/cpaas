import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Rainbow CPaaS platform and APIs.",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs
        items={[
          { label: "Docs", href: "/docs" },
          { label: "FAQ" },
        ]}
      />

      <div className="prose max-w-3xl">
        <h1>Frequently Asked Questions</h1>
        <p>
          Common questions about the Rainbow CPaaS platform. This page will be
          populated with content from the Rainbow developer portal after running
          the content sync pipeline.
        </p>

        <h2 id="general">General</h2>
        <h3>What is Rainbow CPaaS?</h3>
        <p>
          Rainbow CPaaS (Communications Platform as a Service) by Alcatel-Lucent
          Enterprise provides APIs and SDKs for integrating real-time communications
          — messaging, voice, video, and conferencing — into your applications.
        </p>

        <h3>Is there a free tier?</h3>
        <p>
          Rainbow provides a sandbox environment for development and testing at
          no cost. Visit the{" "}
          <a href="/signup">Developer Portal</a>{" "}
          to create a free account.
        </p>

        <h3>Which SDKs are available?</h3>
        <p>
          Rainbow offers native SDKs for Node.js, Web (JavaScript), Android,
          iOS, and C#/.NET, as well as a comprehensive REST API.
        </p>
      </div>
    </div>
  );
}
