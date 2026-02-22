import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const db = payload.db as any;

    // List available methods on db adapter
    const methods = Object.keys(db).filter((k) => typeof db[k] === "function");

    // Try different approaches to create tables
    let result: string | null = null;

    // Approach 1: createMigration + migrate
    if (typeof db.migrate === "function") {
      try {
        await db.migrate();
        result = "migrate() succeeded";
      } catch (err: any) {
        result = `migrate() failed: ${err?.message}`;
      }
    }

    // Approach 2: push
    if (!result && typeof db.push === "function") {
      try {
        await db.push({ forceAcceptWarning: true });
        result = "push() succeeded";
      } catch (err: any) {
        result = `push() failed: ${err?.message}`;
      }
    }

    // Approach 3: Try raw SQL to create tables via drizzle
    if (typeof db.drizzle?.execute === "function") {
      try {
        const tables = await db.drizzle.execute(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
        );
        return NextResponse.json({
          status: "INFO",
          methods,
          migrationResult: result,
          existingTables: tables.rows || tables,
          hasConnect: typeof db.connect === "function",
          hasDrizzle: !!db.drizzle,
        });
      } catch (err: any) {
        // drizzle.execute not available
      }
    }

    // Approach 4: Try connect() which might trigger push
    if (typeof db.connect === "function") {
      try {
        await db.connect(payload);
        result = (result || "") + " | connect() called";
      } catch (err: any) {
        result = (result || "") + ` | connect() failed: ${err?.message}`;
      }
    }

    return NextResponse.json({
      status: "INFO",
      methods,
      migrationResult: result,
      hasConnect: typeof db.connect === "function",
      hasDrizzle: !!db.drizzle,
      pushAvailable: typeof db.push === "function",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 8) },
      { status: 500 }
    );
  }
}
