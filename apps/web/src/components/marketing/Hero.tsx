import Link from "next/link";

interface HeroData {
  badge?: string;
  headline?: string;
  headlineHighlight?: string;
  tagline?: string;
  ctas?: Array<{ label: string; url: string; variant?: string }>;
  codeSnippet?: string;
  codeFilename?: string;
}

const DEFAULTS: HeroData = {
  badge: "Enterprise-grade CPaaS platform",
  headline: "Add communications",
  headlineHighlight: "to your apps",
  tagline:
    "Rainbow CPaaS gives you messaging, voice, video conferencing, and automation through simple APIs and SDKs. Build connected experiences in minutes, not months.",
  ctas: [
    { label: "Get started", url: "/get-started", variant: "primary" },
    { label: "Quickstart guide", url: "/docs/getting-started", variant: "secondary" },
    { label: "API reference", url: "/api-reference", variant: "secondary" },
  ],
  codeSnippet: `import RainbowSDK from "rainbow-node-sdk"

// Initialize the SDK
const rainbow = new RainbowSDK({
  appID: process.env.RAINBOW_APP_ID,
  appSecret: process.env.RAINBOW_APP_SECRET,
});

// Send a message
await rainbow.im.sendMessage("Hello from Rainbow!", contact);`,
  codeFilename: "quickstart.js",
};

export function Hero({ data }: { data?: Record<string, unknown> }) {
  const d: HeroData = { ...DEFAULTS, ...(data || {}) };
  const ctas = (d.ctas || DEFAULTS.ctas) as Array<{ label: string; url: string; variant?: string }>;

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-purple-600/20 via-pink-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          {d.badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium bg-accent/10 text-accent border border-accent/20 rounded-full mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              {d.badge}
            </div>
          )}

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            {d.headline}
            {d.headlineHighlight && (
              <>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                  {d.headlineHighlight}
                </span>
              </>
            )}
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {d.tagline}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {ctas.map((cta, i) => (
              <Link
                key={i}
                href={cta.url}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                  cta.variant === "primary"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border text-foreground hover:bg-muted"
                }`}
              >
                {cta.label}
                {cta.variant === "primary" && (
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Code preview */}
        {d.codeSnippet && (
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="rounded-xl border border-border bg-muted/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <span className="h-3 w-3 rounded-full bg-red-500/60" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <span className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">
                  {d.codeFilename || "quickstart.js"}
                </span>
              </div>
              <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                <code>{d.codeSnippet}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
