import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Rainbow CPaaS — documentation, community, and support channels.",
};

const SUPPORT_OPTIONS = [
  {
    title: "Documentation",
    description: "Browse our comprehensive guides, API references, and SDK documentation.",
    href: "/docs",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    title: "FAQ",
    description: "Find answers to the most commonly asked questions about Rainbow CPaaS.",
    href: "/docs/faq",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    title: "Developer Portal",
    description: "Access the Developer Portal for app management, sandbox, and API keys.",
    href: "/portal/dashboard",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    ),
  },
  {
    title: "Contact Support",
    description: "Reach out to the Rainbow support team for technical assistance.",
    href: "https://support.alcatel-lucent.com",
    external: true,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-2xl mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Support
        </h1>
        <p className="text-lg text-muted-foreground">
          Need help? We have multiple ways to get you the answers you need.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        {SUPPORT_OPTIONS.map((option) => {
          const Comp = option.external ? "a" : Link;
          const extraProps = option.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {};
          return (
            <Comp
              key={option.title}
              href={option.href}
              className="group flex items-start gap-4 p-6 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all"
              {...(extraProps as Record<string, string>)}
            >
              <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                {option.icon}
              </div>
              <div>
                <h2 className="text-base font-semibold group-hover:text-accent transition-colors">
                  {option.title}
                  {option.external && <span className="ml-1 text-xs">&#8599;</span>}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </Comp>
          );
        })}
      </div>
    </div>
  );
}
