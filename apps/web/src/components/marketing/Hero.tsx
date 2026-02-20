import Link from "next/link";

export function Hero() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium bg-accent/10 text-accent border border-accent/20 rounded-full mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Enterprise-grade CPaaS platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Add communications
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              to your apps
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Rainbow CPaaS gives you messaging, voice, video conferencing, and
            automation through simple APIs and SDKs. Build connected experiences
            in minutes, not months.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/get-started"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get started
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/api-reference"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              View API reference
            </Link>
          </div>
        </div>

        {/* Code preview */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="rounded-xl border border-border bg-muted/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <span className="h-3 w-3 rounded-full bg-red-500/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <span className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">quickstart.js</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
              <code>
                <span className="text-purple-400">import</span>{" "}
                <span className="text-amber-300">RainbowSDK</span>{" "}
                <span className="text-purple-400">from</span>{" "}
                <span className="text-green-400">&quot;rainbow-node-sdk&quot;</span>
                {"\n\n"}
                <span className="text-muted-foreground">{"// Initialize the SDK"}</span>
                {"\n"}
                <span className="text-purple-400">const</span>{" "}
                <span className="text-amber-300">rainbow</span>{" "}
                <span className="text-purple-400">=</span>{" "}
                <span className="text-purple-400">new</span>{" "}
                <span className="text-amber-300">RainbowSDK</span>({"{"}{"\n"}
                {"  "}appID: process.env.<span className="text-amber-300">RAINBOW_APP_ID</span>,{"\n"}
                {"  "}appSecret: process.env.<span className="text-amber-300">RAINBOW_APP_SECRET</span>,{"\n"}
                {"}"});{"\n\n"}
                <span className="text-muted-foreground">{"// Send a message"}</span>
                {"\n"}
                <span className="text-purple-400">await</span> rainbow.im.
                <span className="text-blue-400">sendMessage</span>(
                <span className="text-green-400">&quot;Hello from Rainbow!&quot;</span>, contact);
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
