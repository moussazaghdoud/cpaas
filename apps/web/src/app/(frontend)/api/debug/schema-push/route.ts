import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";

  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const db = payload.db as any;

    if (action === "fresh") {
      // migrateFresh: drops everything and recreates
      await db.migrateFresh({ forceAcceptWarning: true });
      const tables = await db.drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      return NextResponse.json({
        status: "OK",
        message: "migrateFresh() completed",
        tables: (tables.rows || tables).map((r: any) => r.table_name),
      });
    }

    if (action === "reconnect") {
      // Try calling connect again which should trigger push:true
      await db.connect(payload);
      const tables = await db.drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      return NextResponse.json({
        status: "OK",
        message: "connect() completed",
        tables: (tables.rows || tables).map((r: any) => r.table_name),
      });
    }

    if (action === "create-migration") {
      // Generate a migration file
      await db.createMigration({ forceAcceptWarning: true, payload });
      return NextResponse.json({ status: "OK", message: "createMigration() completed" });
    }

    // Default: show status
    const tables = await db.drizzle.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    return NextResponse.json({
      status: "INFO",
      action: "status",
      availableActions: ["?action=fresh", "?action=reconnect", "?action=create-migration"],
      existingTables: (tables.rows || tables).map((r: any) => r.table_name),
      pushConfig: !!db.push,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 10) },
      { status: 500 }
    );
  }
}
