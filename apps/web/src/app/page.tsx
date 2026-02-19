import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { TrustSection } from "@/components/marketing/TrustSection";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <TrustSection />

      {/* Final CTA */}
      <section className="py-20 sm:py-28 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to start building?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Explore the documentation, try the sandbox, or jump straight into
            the API reference.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/docs"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              View documentation
            </Link>
            <Link
              href="/api-reference"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              API reference
            </Link>
            <Link
              href="https://developers.openrainbow.com"
              target="_blank"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Try sandbox
              <span className="ml-1 text-xs">&#8599;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
