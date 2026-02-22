import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const db = payload.db as any;
    const drizzle = db.drizzle;
    const results: string[] = [];

    // Step 1: Get all existing tables
    const existing = await drizzle.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    const tableNames = (existing.rows || existing).map((r: any) => r.table_name);
    results.push(`Found ${tableNames.length} existing tables`);

    // Step 2: Drop all tables (CASCADE handles foreign keys)
    for (const name of tableNames) {
      try {
        await drizzle.execute(`DROP TABLE IF EXISTS "${name}" CASCADE`);
        results.push(`Dropped: ${name}`);
      } catch (err: any) {
        results.push(`Drop failed: ${name} — ${err?.message?.substring(0, 60)}`);
      }
    }

    // Step 3: Reconnect — this triggers push:true which recreates all tables
    // using Payload's actual Drizzle schema (correct column types, constraints, etc.)
    try {
      await db.connect(payload);
      results.push("connect() completed — push:true should have recreated tables");
    } catch (err: any) {
      results.push(`connect() error: ${err?.message?.substring(0, 100)}`);
    }

    // Step 4: Verify
    const after = await drizzle.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    const afterNames = (after.rows || after).map((r: any) => r.table_name);

    return NextResponse.json({
      message: "Schema rebuild completed",
      results,
      tablesAfter: afterNames,
      tableCount: afterNames.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 8) },
      { status: 500 }
    );
  }
}
