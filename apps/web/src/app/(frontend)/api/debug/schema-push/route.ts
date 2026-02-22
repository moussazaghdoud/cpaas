import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";

  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const db = payload.db as any;

    if (action === "inspect") {
      const schemaKeys = db.schema ? Object.keys(db.schema).slice(0, 50) : [];
      const tableKeys = db.tables ? Object.keys(db.tables).slice(0, 50) : [];
      return NextResponse.json({
        schemaKeys,
        tableKeys,
        pushOption: db.push,
        prodMode: process.env.NODE_ENV,
        payloadSecret: !!process.env.PAYLOAD_SECRET,
        dbUri: process.env.DATABASE_URI?.substring(0, 25) + "...",
      });
    }

    if (action === "create-tables") {
      // Call init + connect to trigger table creation
      if (typeof db.init === "function") await db.init();
      if (typeof db.connect === "function") await db.connect(payload);
      const tables = await db.drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      return NextResponse.json({
        message: "init + connect completed",
        tables: (tables.rows || tables).map((r: any) => r.table_name),
      });
    }

    if (action === "require-drizzle-kit") {
      // Try Payload's internal drizzle-kit push mechanism
      try {
        if (typeof db.requireDrizzleKit === "function") {
          const kit = await db.requireDrizzleKit();
          return NextResponse.json({
            message: "requireDrizzleKit() returned",
            kitType: typeof kit,
            kitKeys: kit ? Object.keys(kit).slice(0, 20) : [],
          });
        }
        return NextResponse.json({ message: "requireDrizzleKit not available" });
      } catch (err: any) {
        return NextResponse.json({ error: err?.message });
      }
    }

    if (action === "raw-create") {
      // Create core tables with raw SQL as last resort
      const drizzle = db.drizzle;
      const statements = [
        `CREATE TABLE IF NOT EXISTS "payload_migrations" ("id" serial PRIMARY KEY, "name" varchar, "batch" numeric, "created_at" timestamp DEFAULT now(), "updated_at" timestamp DEFAULT now())`,
        `CREATE TABLE IF NOT EXISTS "users" ("id" serial PRIMARY KEY, "name" varchar, "role" varchar DEFAULT 'editor', "updated_at" timestamp DEFAULT now() NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, "email" varchar NOT NULL, "reset_password_token" varchar, "reset_password_expiration" timestamp, "salt" varchar, "hash" varchar, "login_attempts" numeric DEFAULT 0, "lock_until" timestamp)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email")`,
        `CREATE TABLE IF NOT EXISTS "media" ("id" serial PRIMARY KEY, "alt" varchar, "caption" varchar, "updated_at" timestamp DEFAULT now() NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, "url" varchar, "thumbnail_u_r_l" varchar, "filename" varchar, "mime_type" varchar, "filesize" numeric, "width" numeric, "height" numeric)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename")`,
        `CREATE TABLE IF NOT EXISTS "pages" ("id" serial PRIMARY KEY, "title" varchar NOT NULL, "slug" varchar NOT NULL, "description" varchar, "type" varchar DEFAULT 'docs', "markdown_content" text, "source" varchar, "last_synced" varchar, "meta_title" varchar, "meta_description" varchar, "meta_image_id" integer, "updated_at" timestamp DEFAULT now() NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, "_status" varchar DEFAULT 'published')`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" USING btree ("slug")`,
        `CREATE TABLE IF NOT EXISTS "faqs" ("id" serial PRIMARY KEY, "question" varchar NOT NULL, "answer" text NOT NULL, "category" varchar DEFAULT 'general', "updated_at" timestamp DEFAULT now() NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS "sdks" ("id" serial PRIMARY KEY, "name" varchar NOT NULL, "slug" varchar NOT NULL, "language" varchar, "repo_url" varchar, "version" varchar, "description" text, "updated_at" timestamp DEFAULT now() NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "sdks_slug_idx" ON "sdks" USING btree ("slug")`,
        `CREATE TABLE IF NOT EXISTS "navigation" ("id" serial PRIMARY KEY, "updated_at" timestamp, "created_at" timestamp)`,
        `CREATE TABLE IF NOT EXISTS "navigation_items" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL REFERENCES "navigation"("id") ON DELETE cascade, "id" varchar PRIMARY KEY NOT NULL, "label" varchar, "url" varchar)`,
        `CREATE TABLE IF NOT EXISTS "navigation_items_children" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL REFERENCES "navigation_items"("id") ON DELETE cascade, "id" varchar PRIMARY KEY NOT NULL, "label" varchar, "url" varchar)`,
        `CREATE TABLE IF NOT EXISTS "footer" ("id" serial PRIMARY KEY, "updated_at" timestamp, "created_at" timestamp)`,
        `CREATE TABLE IF NOT EXISTS "footer_sections" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL REFERENCES "footer"("id") ON DELETE cascade, "id" varchar PRIMARY KEY NOT NULL, "title" varchar)`,
        `CREATE TABLE IF NOT EXISTS "footer_sections_links" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL REFERENCES "footer_sections"("id") ON DELETE cascade, "id" varchar PRIMARY KEY NOT NULL, "label" varchar, "url" varchar, "external" boolean DEFAULT false)`,
        `CREATE TABLE IF NOT EXISTS "homepage" ("id" serial PRIMARY KEY, "updated_at" timestamp, "created_at" timestamp)`,
        `CREATE TABLE IF NOT EXISTS "site_config" ("id" serial PRIMARY KEY, "site_name" varchar, "site_url" varchar, "description" varchar, "updated_at" timestamp, "created_at" timestamp)`,
      ];

      const results: string[] = [];
      for (const stmt of statements) {
        try {
          await drizzle.execute(stmt);
          results.push("OK: " + stmt.substring(0, 60));
        } catch (err: any) {
          results.push("ERR: " + stmt.substring(0, 60) + " — " + err?.message);
        }
      }

      const tables = await drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      return NextResponse.json({
        message: "raw-create completed",
        results,
        tables: (tables.rows || tables).map((r: any) => r.table_name),
      });
    }

    // Default status
    const tables = await db.drizzle.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    return NextResponse.json({
      availableActions: ["?action=inspect", "?action=create-tables", "?action=require-drizzle-kit", "?action=raw-create"],
      existingTables: (tables.rows || tables).map((r: any) => r.table_name),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 10) },
      { status: 500 }
    );
  }
}
