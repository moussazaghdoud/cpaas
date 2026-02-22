import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";

  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const db = payload.db as any;

    if (action === "inspect") {
      // Show all table names from Payload's internal schema
      const schemaKeys = db.schema ? Object.keys(db.schema) : [];
      // Get the Drizzle table objects
      const tableNames: string[] = [];
      if (db.schema) {
        for (const [key, val] of Object.entries(db.schema)) {
          if (val && typeof val === "object" && (val as any)[Symbol.for("drizzle:Name")]) {
            tableNames.push((val as any)[Symbol.for("drizzle:Name")]);
          }
        }
      }
      return NextResponse.json({ schemaKeys, tableNames });
    }

    if (action === "auto-create") {
      // Extract all table definitions from Payload's Drizzle schema and create them
      const drizzle = db.drizzle;
      const schema = db.schema;

      if (!schema) {
        return NextResponse.json({ error: "No schema found on db adapter" });
      }

      // Get all SQL from drizzle schema by introspecting table objects
      // First, let's get all table names Payload expects
      const expectedTables: string[] = [];
      const tableObjects: any[] = [];

      for (const [key, val] of Object.entries(schema)) {
        if (val && typeof val === "object") {
          const name = (val as any)[Symbol.for("drizzle:Name")];
          if (name && typeof name === "string") {
            expectedTables.push(name);
            tableObjects.push({ key, name, obj: val });
          }
        }
      }

      // Get existing tables
      const existing = await drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      const existingNames = new Set((existing.rows || existing).map((r: any) => r.table_name));
      const missing = expectedTables.filter((t) => !existingNames.has(t));

      return NextResponse.json({
        expectedTables: expectedTables.sort(),
        existingTables: [...existingNames].sort(),
        missingTables: missing.sort(),
        hint: "Use ?action=raw-create-all to create missing tables, or check the schema keys with ?action=schema-sql",
      });
    }

    if (action === "schema-sql") {
      // Try to generate DDL SQL from the Drizzle schema
      try {
        const { getTableConfig } = await import("drizzle-orm/pg-core");
        const schema = db.schema;
        const tableInfos: any[] = [];

        for (const [key, val] of Object.entries(schema)) {
          try {
            const config = getTableConfig(val as any);
            if (config?.name) {
              tableInfos.push({
                name: config.name,
                columns: config.columns.map((c: any) => ({
                  name: c.name,
                  type: c.getSQLType(),
                  notNull: c.notNull,
                  hasDefault: c.hasDefault,
                  primaryKey: c.primary,
                })),
              });
            }
          } catch {
            // Not a table
          }
        }
        return NextResponse.json({ tables: tableInfos });
      } catch (err: any) {
        return NextResponse.json({ error: err?.message });
      }
    }

    if (action === "raw-create-all") {
      // Generate and execute CREATE TABLE statements from Drizzle schema
      const { getTableConfig } = await import("drizzle-orm/pg-core");
      const schema = db.schema;
      const drizzle = db.drizzle;
      const results: string[] = [];

      // Collect all tables with their configs
      const tables: { name: string; config: any }[] = [];
      for (const [key, val] of Object.entries(schema)) {
        try {
          const config = getTableConfig(val as any);
          if (config?.name) tables.push({ name: config.name, config });
        } catch {
          // Not a table
        }
      }

      // Sort: tables without foreign keys first
      const withFk = tables.filter((t) => t.config.foreignKeys?.length > 0);
      const withoutFk = tables.filter((t) => !t.config.foreignKeys?.length);
      const sorted = [...withoutFk, ...withFk];

      for (const { name, config } of sorted) {
        const cols = config.columns.map((c: any) => {
          let def = `"${c.name}" ${c.getSQLType()}`;
          if (c.primary) def += " PRIMARY KEY";
          if (c.notNull && !c.primary) def += " NOT NULL";
          if (c.hasDefault && c.default !== undefined) {
            const d = c.defaultFn ? null : c.default;
            if (d !== null && d !== undefined) def += ` DEFAULT ${typeof d === "string" ? `'${d}'` : d}`;
          }
          return def;
        });

        const sql = `CREATE TABLE IF NOT EXISTS "${name}" (${cols.join(", ")})`;
        try {
          await drizzle.execute(sql);
          results.push(`OK: ${name}`);
        } catch (err: any) {
          results.push(`ERR: ${name} — ${err?.message?.substring(0, 100)}`);
        }
      }

      // Create indexes
      for (const { name, config } of sorted) {
        if (config.indexes) {
          for (const idx of config.indexes) {
            try {
              const idxName = idx.config?.name || `${name}_idx`;
              const idxCols = idx.config?.columns?.map((c: any) => `"${c.name}"`).join(", ");
              if (idxCols) {
                const unique = idx.config?.unique ? "UNIQUE " : "";
                const idxSql = `CREATE ${unique}INDEX IF NOT EXISTS "${idxName}" ON "${name}" (${idxCols})`;
                await drizzle.execute(idxSql);
                results.push(`IDX OK: ${idxName}`);
              }
            } catch (err: any) {
              results.push(`IDX ERR: ${err?.message?.substring(0, 80)}`);
            }
          }
        }
      }

      const finalTables = await drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      return NextResponse.json({
        message: "raw-create-all completed",
        results,
        tables: (finalTables.rows || finalTables).map((r: any) => r.table_name),
      });
    }

    // Default status
    const tables = await db.drizzle.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    return NextResponse.json({
      availableActions: [
        "?action=inspect",
        "?action=auto-create",
        "?action=schema-sql",
        "?action=raw-create-all",
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
