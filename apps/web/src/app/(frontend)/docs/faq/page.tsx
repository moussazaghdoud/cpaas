import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Rainbow CPaaS platform and APIs.",
};

const FAQS = [
  {
    category: "General",
    items: [
      {
        q: "What is Rainbow CPaaS?",
        a: "Rainbow CPaaS (Communications Platform as a Service) by Alcatel-Lucent Enterprise provides APIs and SDKs for integrating real-time communications — messaging, voice, video, and conferencing — into your applications.",
      },
      {
        q: "Is there a free tier?",
        a: "Yes. Rainbow provides a free sandbox environment for development and testing. Sign up through the Developer Portal to get started at no cost.",
      },
      {
        q: "Which SDKs are available?",
        a: "Rainbow offers native SDKs for Node.js, Web (JavaScript), Web v2, Android, iOS, C#/.NET, React Native, and a CLI tool, as well as a comprehensive REST API.",
      },
    ],
  },
  {
    category: "Authentication",
    items: [
      {
        q: "How do I authenticate with Rainbow APIs?",
        a: "Use the login endpoint with Basic Auth (email:password) plus your application's x-rainbow-app-auth header. You'll receive a JWT token to use for subsequent API calls.",
      },
      {
        q: "How long do tokens last?",
        a: "Rainbow JWT tokens are valid for 15 days (21600 minutes). You can renew them before expiry using the /api/rainbow/authentication/v1.0/renew endpoint.",
      },
      {
        q: "What are Application ID and Secret Key?",
        a: "These are generated when you create an application in the Developer Portal. They identify your application when making API calls and are required for authentication.",
      },
    ],
  },
  {
    category: "Development",
    items: [
      {
        q: "What's the difference between sandbox and production?",
        a: "Sandbox (sandbox.openrainbow.com) is for development and testing. Production (openrainbow.com) is for live applications. Create and test your app on sandbox first, then request deployment to production.",
      },
      {
        q: "How do I create an application?",
        a: "Log into the Developer Portal, go to Applications, and click 'Create Application'. Fill in your app details and choose your environment (sandbox or production).",
      },
      {
        q: "Can I use Rainbow APIs from a browser?",
        a: "Yes. The Web SDK and Web SDK v2 are designed for browser-based applications. For direct REST API calls from a browser, you may need to proxy through your backend to handle CORS.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs
        items={[
          { label: "Docs", href: "/docs" },
          { label: "FAQ" },
        ]}
      />

      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-muted-foreground mb-10">
          Common questions about the Rainbow CPaaS platform.
        </p>

        <div className="space-y-10">
          {FAQS.map((section) => (
            <div key={section.category}>
              <h2 className="text-lg font-semibold mb-4">{section.category}</h2>
              <div className="space-y-4">
                {section.items.map((faq) => (
                  <details
                    key={faq.q}
                    className="group rounded-lg border border-border bg-card"
                  >
                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium list-none flex items-center justify-between">
                      {faq.q}
                      <svg
                        className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="px-4 pb-3 text-sm text-muted-foreground">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
