import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { TrustSection } from "@/components/marketing/TrustSection";
import { CTASection } from "@/components/marketing/CTASection";
import Link from "next/link";

interface BlockData {
  blockType: string;
  [key: string]: unknown;
}

export function BlockRenderer({ blocks }: { blocks: BlockData[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.blockType) {
          case "hero":
            return <Hero key={index} data={block} />;
          case "featureGrid":
            return <FeatureGrid key={index} data={block} />;
          case "howItWorks":
            return <HowItWorks key={index} data={block} />;
          case "trustSection":
            return <TrustSection key={index} data={block} />;
          case "cta":
            return <CTASection key={index} data={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
