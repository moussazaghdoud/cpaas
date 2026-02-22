interface TrustSectionData {
  heading?: string;
  subheading?: string;
  items?: Array<{ title: string; description: string; icon?: string }>;
}

const DEFAULT_ITEMS = [
  {
    title: "TLS Encryption",
    description: "All API communications are encrypted with TLS 1.2+ to protect data in transit.",
  },
  {
    title: "OAuth 2.0 & JWT",
    description: "Industry-standard authentication with OAuth 2.0 flows and JWT token-based access control.",
  },
  {
    title: "API Key Management",
    description: "Dedicated application credentials with granular permission scopes for secure integration.",
  },
  {
    title: "Enterprise Ready",
    description: "Built by Alcatel-Lucent Enterprise with data residency options and compliance certifications.",
  },
];

export function TrustSection({ data }: { data?: Record<string, unknown> }) {
  const d = (data || {}) as TrustSectionData;
  const heading = d.heading || "Enterprise security built in";
  const subheading = d.subheading || "Rainbow is designed for enterprise deployments with security at every layer.";
  const items = d.items || DEFAULT_ITEMS;

  return (
    <section className="py-20 sm:py-28 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {heading}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {items.map((item) => (
            <div key={item.title} className="flex gap-3 p-5 rounded-lg border border-border">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
