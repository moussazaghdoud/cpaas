import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "diagnose";

  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const db = payload.db as any;
    const drizzle = db.drizzle;

    if (action === "diagnose") {
      const results: Record<string, unknown> = {};

      // 1. List all tables Payload's Drizzle schema expects
      try {
        const { getTableConfig } = await import("drizzle-orm/pg-core");
        const schema = db.schema;
        const expectedTables: string[] = [];
        for (const [key, val] of Object.entries(schema)) {
          try {
            const config = getTableConfig(val as any);
            if (config?.name) expectedTables.push(config.name);
          } catch { /* not a table */ }
        }
        results.expectedTables = expectedTables.sort();
        results.expectedCount = expectedTables.length;
      } catch (err: any) {
        results.schemaError = err?.message;
      }

      // 2. List all actual tables in database
      const actual = await drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      const actualTables = (actual.rows || actual).map((r: any) => r.table_name);
      results.actualTables = actualTables;
      results.actualCount = actualTables.length;

      // 3. Find missing tables
      if (results.expectedTables) {
        const missing = (results.expectedTables as string[]).filter(
          (t) => !actualTables.includes(t)
        );
        results.missingTables = missing;
        results.missingCount = missing.length;
      }

      // 4. Check column types for pages table
      const pagesCols = await drizzle.execute(
        `SELECT column_name, data_type, udt_name, character_maximum_length
         FROM information_schema.columns
         WHERE table_name = 'pages' AND table_schema = 'public'
         ORDER BY ordinal_position`
      );
      results.pagesColumns = (pagesCols.rows || pagesCols).map((r: any) => ({
        name: r.column_name,
        type: r.data_type,
        udt: r.udt_name,
        maxLen: r.character_maximum_length,
      }));

      // 5. Check column types for _pages_v table
      const pagesVCols = await drizzle.execute(
        `SELECT column_name, data_type, udt_name, character_maximum_length
         FROM information_schema.columns
         WHERE table_name = '_pages_v' AND table_schema = 'public'
         ORDER BY ordinal_position`
      );
      results.pagesVColumns = (pagesVCols.rows || pagesVCols).map((r: any) => ({
        name: r.column_name,
        type: r.data_type,
        udt: r.udt_name,
        maxLen: r.character_maximum_length,
      }));

      // 6. Row counts
      const counts: Record<string, number> = {};
      for (const table of ["pages", "_pages_v", "sdks", "users", "media", "faqs",
        "payload_locked_documents", "payload_preferences", "payload_migrations"]) {
        try {
          const r = await drizzle.execute(`SELECT count(*) as c FROM "${table}"`);
          counts[table] = parseInt((r.rows || r)[0]?.c || "0");
        } catch {
          counts[table] = -1; // table doesn't exist
        }
      }
      results.rowCounts = counts;

      // 7. Check enum types
      const enums = await drizzle.execute(
        `SELECT typname FROM pg_type WHERE typcategory = 'E' ORDER BY typname`
      );
      results.enumTypes = (enums.rows || enums).map((r: any) => r.typname);

      return NextResponse.json(results);
    }

    if (action === "fix-columns") {
      const results: string[] = [];

      // Fix textarea columns: varchar -> text
      const alterStatements = [
        // pages table
        `ALTER TABLE "pages" ALTER COLUMN "description" TYPE text`,
        `ALTER TABLE "pages" ALTER COLUMN "markdown_content" TYPE text`,
        `ALTER TABLE "pages" ALTER COLUMN "seo_meta_description" TYPE text`,
        // _pages_v table
        `ALTER TABLE "_pages_v" ALTER COLUMN "version_description" TYPE text`,
        `ALTER TABLE "_pages_v" ALTER COLUMN "version_markdown_content" TYPE text`,
        `ALTER TABLE "_pages_v" ALTER COLUMN "version_seo_meta_description" TYPE text`,
        // sdks table
        `ALTER TABLE "sdks" ALTER COLUMN "description" TYPE text`,
        // site_config table
        `ALTER TABLE "site_config" ALTER COLUMN "description" TYPE text`,
      ];

      for (const sql of alterStatements) {
        try {
          await drizzle.execute(sql);
          results.push("OK: " + sql.substring(13));
        } catch (err: any) {
          results.push("SKIP: " + sql.substring(13) + " — " + err?.message?.substring(0, 80));
        }
      }

      return NextResponse.json({ message: "Column fixes applied", results });
    }

    if (action === "test-create") {
      const results: string[] = [];

      // Count before
      let beforeCount = 0;
      try {
        const r = await drizzle.execute(`SELECT count(*) as c FROM pages`);
        beforeCount = parseInt((r.rows || r)[0]?.c || "0");
        results.push(`Before: ${beforeCount} rows in pages`);
      } catch (err: any) {
        results.push("Count error: " + err?.message);
      }

      // Try creating a single test page with minimal data
      let createResult: any = null;
      let createError: any = null;
      try {
        createResult = await payload.create({
          collection: "pages",
          data: {
            title: "Test Page " + Date.now(),
            slug: "test-page-" + Date.now(),
            description: "A test page to verify persistence",
            type: "docs",
            markdownContent: "# Test\n\nThis is a test page.",
            _status: "published",
          },
        });
        results.push("payload.create() returned: id=" + createResult?.id + ", slug=" + createResult?.slug);
      } catch (err: any) {
        createError = err;
        results.push("payload.create() ERROR: " + err?.message);
        if (err?.data) {
          results.push("Error data: " + JSON.stringify(err.data).substring(0, 300));
        }
      }

      // Count after
      let afterCount = 0;
      try {
        const r = await drizzle.execute(`SELECT count(*) as c FROM pages`);
        afterCount = parseInt((r.rows || r)[0]?.c || "0");
        results.push(`After: ${afterCount} rows in pages`);
      } catch (err: any) {
        results.push("Count error: " + err?.message);
      }

      // Check _pages_v too
      let versionsCount = 0;
      try {
        const r = await drizzle.execute(`SELECT count(*) as c FROM _pages_v`);
        versionsCount = parseInt((r.rows || r)[0]?.c || "0");
        results.push(`Versions: ${versionsCount} rows in _pages_v`);
      } catch (err: any) {
        results.push("Versions count error: " + err?.message);
      }

      // If create returned an ID, try to find it directly via SQL
      if (createResult?.id) {
        try {
          const r = await drizzle.execute(
            `SELECT id, title, slug, _status FROM pages WHERE id = ${createResult.id}`
          );
          const rows = r.rows || r;
          results.push(`Direct SQL lookup: found ${rows.length} rows`);
          if (rows.length > 0) {
            results.push("Row: " + JSON.stringify(rows[0]));
          }
        } catch (err: any) {
          results.push("Lookup error: " + err?.message);
        }
      }

      // Also try payload.find with overrideAccess
      try {
        const found = await payload.find({
          collection: "pages",
          limit: 5,
          overrideAccess: true,
        });
        results.push(`payload.find(): totalDocs=${found.totalDocs}, docs.length=${found.docs.length}`);
        if (found.docs.length > 0) {
          results.push("First doc: " + JSON.stringify({ id: found.docs[0].id, title: found.docs[0].title, slug: found.docs[0].slug }));
        }
      } catch (err: any) {
        results.push("payload.find() error: " + err?.message);
      }

      return NextResponse.json({
        message: "Test create completed",
        persisted: afterCount > beforeCount,
        createResult: createResult ? { id: createResult.id, slug: createResult.slug, _status: createResult._status } : null,
        createError: createError?.message || null,
        results,
      });
    }

    if (action === "create-missing-tables") {
      // Read Payload's Drizzle schema and create any missing tables
      const { getTableConfig } = await import("drizzle-orm/pg-core");
      const schema = db.schema;
      const results: string[] = [];

      // Get existing tables
      const existing = await drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      const existingSet = new Set((existing.rows || existing).map((r: any) => r.table_name));

      // Collect all expected tables
      const tables: { name: string; config: any }[] = [];
      for (const [key, val] of Object.entries(schema)) {
        try {
          const config = getTableConfig(val as any);
          if (config?.name) tables.push({ name: config.name, config });
        } catch { /* not a table */ }
      }

      // Only create missing ones
      const missing = tables.filter((t) => !existingSet.has(t.name));
      results.push(`Found ${missing.length} missing tables out of ${tables.length} expected`);

      for (const { name, config } of missing) {
        const cols = config.columns.map((c: any) => {
          let def = `"${c.name}" ${c.getSQLType()}`;
          if (c.primary) def += " PRIMARY KEY";
          if (c.notNull && !c.primary) def += " NOT NULL";
          if (c.hasDefault && c.default !== undefined) {
            const d = c.defaultFn ? null : c.default;
            if (d !== null && d !== undefined) {
              if (typeof d === "string") def += ` DEFAULT '${d}'`;
              else if (typeof d === "boolean") def += ` DEFAULT ${d}`;
              else def += ` DEFAULT ${d}`;
            }
          }
          return def;
        });

        const sql = `CREATE TABLE IF NOT EXISTS "${name}" (${cols.join(", ")})`;
        try {
          await drizzle.execute(sql);
          results.push(`CREATED: ${name} (${config.columns.length} cols)`);
        } catch (err: any) {
          results.push(`ERR: ${name} — ${err?.message?.substring(0, 100)}`);
        }
      }

      // Create indexes for missing tables
      for (const { name, config } of missing) {
        if (config.indexes) {
          for (const idx of config.indexes) {
            try {
              const idxName = idx.config?.name || `${name}_idx`;
              const idxCols = idx.config?.columns?.map((c: any) => `"${c.name}"`).join(", ");
              if (idxCols) {
                const unique = idx.config?.unique ? "UNIQUE " : "";
                await drizzle.execute(`CREATE ${unique}INDEX IF NOT EXISTS "${idxName}" ON "${name}" (${idxCols})`);
              }
            } catch { /* skip */ }
          }
        }
      }

      // Final count
      const after = await drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      const afterNames = (after.rows || after).map((r: any) => r.table_name);

      return NextResponse.json({
        message: "Missing tables created",
        results,
        totalTables: afterNames.length,
        allTables: afterNames,
      });
    }

    if (action === "nuclear-rebuild") {
      // Drop EVERYTHING and let Payload recreate from scratch
      const results: string[] = [];

      // 1. Drop all tables
      const tables = await drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      const tableNames = (tables.rows || tables).map((r: any) => r.table_name);
      for (const name of tableNames) {
        try {
          await drizzle.execute(`DROP TABLE IF EXISTS "${name}" CASCADE`);
          results.push(`Dropped table: ${name}`);
        } catch (err: any) {
          results.push(`Drop table failed: ${name} — ${err?.message?.substring(0, 60)}`);
        }
      }

      // 2. Drop all enum types
      const enums = await drizzle.execute(
        `SELECT typname FROM pg_type JOIN pg_namespace ON pg_type.typnamespace = pg_namespace.oid
         WHERE typcategory = 'E' AND nspname = 'public' ORDER BY typname`
      );
      const enumNames = (enums.rows || enums).map((r: any) => r.typname);
      for (const name of enumNames) {
        try {
          await drizzle.execute(`DROP TYPE IF EXISTS "${name}" CASCADE`);
          results.push(`Dropped enum: ${name}`);
        } catch (err: any) {
          results.push(`Drop enum failed: ${name} — ${err?.message?.substring(0, 60)}`);
        }
      }

      // 3. Try to trigger Payload schema push by re-connecting
      try {
        // The db adapter should have a push mechanism
        if (typeof db.push === "function") {
          await db.push({ payload });
          results.push("db.push() completed");
        } else if (typeof db.connect === "function") {
          await db.connect(payload);
          results.push("db.connect() completed");
        } else {
          results.push("No push/connect method available on db adapter");
        }
      } catch (err: any) {
        results.push(`Reconnect error: ${err?.message?.substring(0, 150)}`);
      }

      // 4. Check what got created
      const after = await drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      const afterNames = (after.rows || after).map((r: any) => r.table_name);

      return NextResponse.json({
        message: "Nuclear rebuild completed",
        droppedTables: tableNames.length,
        droppedEnums: enumNames.length,
        tablesAfter: afterNames,
        tableCountAfter: afterNames.length,
        results,
      });
    }

    return NextResponse.json({
      availableActions: [
        "?action=diagnose — Show expected vs actual tables, column types, row counts",
        "?action=fix-columns — Fix varchar->text for textarea fields",
        "?action=test-create — Create a single test page and verify persistence",
        "?action=create-missing-tables — Create any tables that Payload expects but don't exist",
        "?action=nuclear-rebuild — Drop everything and let Payload recreate from scratch",
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 10) },
      { status: 500 }
    );
  }
}
