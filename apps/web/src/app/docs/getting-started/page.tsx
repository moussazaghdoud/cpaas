import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Callout } from "@/components/ui/Callout";
import { TableOfContents } from "@/components/docs/TableOfContents";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Getting Started",
  description: "Get started with Rainbow CPaaS — create your application, get API keys, and make your first API call.",
};

const TOC = [
  { id: "prerequisites", text: "Prerequisites", level: 2 },
  { id: "create-application", text: "Create your application", level: 2 },
  { id: "get-credentials", text: "Get your credentials", level: 2 },
  { id: "make-first-call", text: "Make your first API call", level: 2 },
  { id: "next-steps", text: "Next steps", level: 2 },
];

export default function GettingStartedPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex gap-10">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Breadcrumbs
            items={[
              { label: "Docs", href: "/docs" },
              { label: "Getting Started" },
            ]}
          />

          <div className="prose">
            <h1>Getting Started</h1>
            <p>
              This guide walks you through creating a Rainbow application, obtaining
              your API credentials, and making your first API call.
            </p>

            <h2 id="prerequisites">Prerequisites</h2>
            <ul>
              <li>A Rainbow account — <a href="https://developers.openrainbow.com" target="_blank" rel="noopener noreferrer">sign up here</a></li>
              <li>Node.js 16+ (for the Node.js SDK) or any HTTP client for REST APIs</li>
            </ul>

            <Callout type="info">
              <p>
                Rainbow offers a free sandbox environment for development and testing.
                You can create applications and test API calls without any cost.
              </p>
            </Callout>

            <h2 id="create-application">Create your application</h2>
            <ol>
              <li>Log in to the <a href="https://developers.openrainbow.com" target="_blank" rel="noopener noreferrer">Rainbow Developer Hub</a></li>
              <li>Navigate to the Applications section</li>
              <li>Click &quot;Create Application&quot;</li>
              <li>Fill in your application details (name, description, platform)</li>
              <li>Submit and wait for approval</li>
            </ol>

            <h2 id="get-credentials">Get your credentials</h2>
            <p>
              Once your application is approved, you will receive:
            </p>
            <ul>
              <li><strong>Application ID</strong> — identifies your application</li>
              <li><strong>Application Secret</strong> — used for authentication</li>
            </ul>

            <Callout type="warning">
              <p>
                Keep your Application Secret secure. Never expose it in client-side
                code or commit it to version control.
              </p>
            </Callout>

            <h2 id="make-first-call">Make your first API call</h2>
            <p>
              Here is a quick example using the Node.js SDK:
            </p>
            <pre><code className="language-javascript">{`const RainbowSDK = require("rainbow-node-sdk");

const rainbow = new RainbowSDK({
  rainbow: {
    host: "sandbox",
  },
  credentials: {
    login: "your-email@example.com",
    password: "your-password",
  },
  application: {
    appID: "YOUR_APP_ID",
    appSecret: "YOUR_APP_SECRET",
  },
});

rainbow.events.on("rainbow_onready", () => {
  console.log("Connected to Rainbow!");
});

rainbow.start();`}</code></pre>

            <p>Or with a simple REST API call using cURL:</p>
            <pre><code className="language-bash">{`curl -X GET "https://openrainbow.com/api/rainbow/authentication/v1.0/login" \\
  -H "Authorization: Basic $(echo -n 'email:password' | base64)" \\
  -H "x-rainbow-app-auth: $(echo -n 'appId:appSecret' | base64)"`}</code></pre>

            <h2 id="next-steps">Next steps</h2>
            <ul>
              <li><Link href="/docs/guides">Explore the guides</Link> for messaging, voice, conferencing, and more</li>
              <li><Link href="/api-reference">Browse the API reference</Link> for all available endpoints</li>
              <li><Link href="/docs/sdk">Choose an SDK</Link> for your platform</li>
            </ul>
          </div>
        </div>

        {/* Table of contents */}
        <TableOfContents headings={TOC} />
      </div>
    </div>
  );
}
