import Link from "next/link";
import { FOOTER_SECTIONS, SITE_NAME } from "@/lib/constants";

interface FooterLink {
  label: string;
  url?: string;
  href?: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

async function getFooterData(): Promise<FooterSection[]> {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const footer = await payload.findGlobal({ slug: "footer" });
    if (footer?.sections && Array.isArray(footer.sections) && footer.sections.length > 0) {
      return footer.sections as FooterSection[];
    }
  } catch {
    // Payload not available
  }
  // Fallback to constants
  return FOOTER_SECTIONS.map((section) => ({
    title: section.title,
    links: section.links.map((link) => ({
      label: link.label,
      url: link.href,
      external: "external" in link ? (link as { external?: boolean }).external : false,
    })),
  }));
}

export async function Footer() {
  const sections = await getFooterData();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <img src="/rainbow-logo.png" alt="Rainbow" className="h-6 w-6" />
              <span>{SITE_NAME}</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Enterprise-grade communications platform. Add messaging, voice, video, and more to your applications.
            </p>
          </div>

          {/* Link sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => {
                  const href = link.url || link.href || "/";
                  return (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                          <span className="ml-1 text-xs">&#8599;</span>
                        </a>
                      ) : (
                        <Link
                          href={href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Alcatel-Lucent Enterprise. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/legal" className="hover:text-foreground transition-colors">
              Legal
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
