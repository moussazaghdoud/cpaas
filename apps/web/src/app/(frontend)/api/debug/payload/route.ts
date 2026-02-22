import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URI_PREFIX: process.env.DATABASE_URI?.substring(0, 20) + "...",
      PAYLOAD_SECRET_SET: !!process.env.PAYLOAD_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  // Test Local API
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    results.localApi = "OK";

    // Test a query
    try {
      const nav = await payload.findGlobal({ slug: "navigation" });
      results.globalQuery = { status: "OK", itemCount: (nav as any)?.items?.length ?? 0 };
    } catch (err: any) {
      results.globalQuery = { status: "ERROR", message: err?.message };
    }

    // Test users collection
    try {
      const users = await payload.find({ collection: "users", limit: 1 });
      results.usersQuery = { status: "OK", totalDocs: users.totalDocs };
    } catch (err: any) {
      results.usersQuery = { status: "ERROR", message: err?.message };
    }
  } catch (err: any) {
    results.localApi = { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 5) };
  }

  // Test REST API handler directly
  try {
    const { REST_GET } = await import("@payloadcms/next/routes");
    results.restImport = "OK";
  } catch (err: any) {
    results.restImport = { status: "ERROR", message: err?.message };
  }

  return NextResponse.json(results, { status: 200 });
}
