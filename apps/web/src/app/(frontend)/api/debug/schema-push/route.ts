import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();

    // Force push schema to database (creates all tables)
    if (typeof (payload.db as any).push === "function") {
      await (payload.db as any).push({ forceAcceptWarning: true });
      return NextResponse.json({ status: "OK", message: "Schema pushed successfully" });
    }

    // Alternative: try to access drizzle directly
    return NextResponse.json({
      status: "INFO",
      message: "push() not available on db adapter. Tables may need manual migration.",
      dbType: typeof payload.db,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 8) },
      { status: 500 }
    );
  }
}
