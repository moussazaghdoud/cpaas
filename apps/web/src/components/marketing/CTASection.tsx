import Link from "next/link";

interface CTAData {
  heading?: string;
  description?: string;
  buttons?: Array<{ label: string; url: string; variant?: string }>;
}

export function CTASection({ data }: { data?: Record<string, unknown> }) {
  const d = (data || {}) as CTAData;
  const heading = d.heading || "Ready to start building?";
  const description = d.description || "Explore the documentation, try the sandbox, or jump straight into the API reference.";
  const buttons = d.buttons || [
    { label: "View documentation", url: "/docs", variant: "primary" },
    { label: "API reference", url: "/api-reference", variant: "secondary" },
    { label: "Try sandbox", url: "/portal/sandbox", variant: "secondary" },
  ];

  return (
    <section className="py-20 sm:py-28 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          {heading}
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {buttons.map((btn, i) => (
            <Link
              key={i}
              href={btn.url}
              className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                btn.variant === "primary"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border text-foreground hover:bg-muted"
              }`}
            >
              {btn.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
