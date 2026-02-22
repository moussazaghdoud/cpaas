import { NextResponse } from "next/server";
import { NAV_ITEMS } from "@/lib/constants";

export async function GET() {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const nav = await payload.findGlobal({ slug: "navigation" });
    if (nav?.items && Array.isArray(nav.items) && nav.items.length > 0) {
      return NextResponse.json(nav);
    }
  } catch {
    // Payload not available
  }

  // Fallback to constants
  return NextResponse.json({
    items: NAV_ITEMS.map((item) => ({ label: item.label, url: item.href })),
  });
}
