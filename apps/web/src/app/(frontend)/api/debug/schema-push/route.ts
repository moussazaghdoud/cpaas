import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";

  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const db = payload.db as any;

    if (action === "drizzle-push") {
      // Try to use drizzle-kit push API directly
      try {
        const drizzleKit = await import("drizzle-kit/api");
        if (drizzleKit.push) {
          const result = await drizzleKit.push({
            dialect: "postgresql",
            credentials: {
              url: process.env.DATABASE_URI!,
            },
            schema: db.schema || {},
            tablesFilter: ["!_*"],
          });
          return NextResponse.json({ status: "OK", message: "drizzle-kit push completed", result });
        }
      } catch (err: any) {
        return NextResponse.json({
          status: "ERROR",
          message: `drizzle-kit push failed: ${err?.message}`,
          stack: err?.stack?.split("\n").slice(0, 5),
        });
      }
    }

    if (action === "create-tables") {
      // Use payload.db internal schema to create tables via raw SQL
      const schema = db.schema;
      const schemaKeys = schema ? Object.keys(schema) : [];

      // Try to get the SQL from drizzle
      try {
        const { sql } = await import("drizzle-orm");
        const drizzle = db.drizzle;

        // Create extensions first
        if (typeof db.createExtensions === "function") {
          await db.createExtensions();
        }

        // Try generating schema
        if (typeof db.generateSchema === "function") {
          await db.generateSchema();
        }

        // Try init which sets up tables
        if (typeof db.init === "function") {
          await db.init();
        }

        // Now try connect again
        await db.connect(payload);

        const tables = await drizzle.execute(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
        );
        return NextResponse.json({
          status: "OK",
          message: "init + connect completed",
          tables: (tables.rows || tables).map((r: any) => r.table_name),
          schemaKeys,
        });
      } catch (err: any) {
        return NextResponse.json({
          status: "ERROR",
          message: err?.message,
          schemaKeys,
          stack: err?.stack?.split("\n").slice(0, 8),
        });
      }
    }

    if (action === "inspect") {
      // Inspect the db adapter internals
      const schema = db.schema;
      const schemaKeys = schema ? Object.keys(schema).slice(0, 30) : [];
      const tables = db.tables ? Object.keys(db.tables).slice(0, 30) : [];
      return NextResponse.json({
        status: "INFO",
        schemaKeys,
        tableKeys: tables,
        hasDrizzle: !!db.drizzle,
        hasSchema: !!db.schema,
        pushOption: db.push,
        prodMode: process.env.NODE_ENV,
        payloadSecret: !!process.env.PAYLOAD_SECRET,
        dbUri: process.env.DATABASE_URI?.substring(0, 25) + "...",
      });
    }

    // Default status
    const tables = await db.drizzle.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    return NextResponse.json({
      status: "INFO",
      availableActions: [
        "?action=inspect",
        "?action=create-tables",
        "?action=drizzle-push",
      ],
      existingTables: (tables.rows || tables).map((r: any) => r.table_name),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 10) },
      { status: 500 }
    );
  }
}
