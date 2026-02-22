import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { TrustSection } from "@/components/marketing/TrustSection";
import { CTASection } from "@/components/marketing/CTASection";
import { BlockRenderer } from "@/components/BlockRenderer";

async function getHomepageBlocks() {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const homepage = await payload.findGlobal({ slug: "homepage" });
    if (homepage?.blocks && Array.isArray(homepage.blocks) && homepage.blocks.length > 0) {
      return homepage.blocks as Array<{ blockType: string; [key: string]: unknown }>;
    }
  } catch {
    // Payload not available — use defaults
  }
  return null;
}

export default async function HomePage() {
  const blocks = await getHomepageBlocks();

  // If CMS blocks are available, render them dynamically
  if (blocks) {
    return <BlockRenderer blocks={blocks} />;
  }

  // Fallback: render hardcoded sections (pre-migration)
  return (
    <>
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <TrustSection />
      <CTASection />
    </>
  );
}
