import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const drizzle = (payload.db as any).drizzle;
    const results: string[] = [];

    // Drop the incorrectly-created versions first
    const toDrop = [
      "users", "media", "faqs", "sdks", "pages", "_pages_v",
      "payload_locked_documents", "payload_preferences", "payload_migrations",
    ];
    for (const t of toDrop) {
      try {
        await drizzle.execute(`DROP TABLE IF EXISTS "${t}" CASCADE`);
        results.push(`Dropped: ${t}`);
      } catch (err: any) {
        results.push(`Drop skip: ${t}`);
      }
    }

    // Create tables with exact Payload-expected schema
    const statements = [
      // Users (auth collection)
      `CREATE TABLE "users" (
        "id" serial PRIMARY KEY,
        "name" varchar,
        "role" "enum_users_role" DEFAULT 'editor',
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "email" varchar NOT NULL,
        "reset_password_token" varchar,
        "reset_password_expiration" timestamp(3) with time zone,
        "salt" varchar,
        "hash" varchar,
        "login_attempts" numeric DEFAULT 0,
        "lock_until" timestamp(3) with time zone
      )`,

      // Media
      `CREATE TABLE "media" (
        "id" serial PRIMARY KEY,
        "alt" varchar NOT NULL,
        "caption" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "url" varchar,
        "thumbnail_u_r_l" varchar,
        "filename" varchar,
        "mime_type" varchar,
        "filesize" numeric,
        "width" numeric,
        "height" numeric
      )`,

      // FAQs
      `CREATE TABLE "faqs" (
        "id" serial PRIMARY KEY,
        "question" varchar NOT NULL,
        "answer" text NOT NULL,
        "category" "enum_faqs_category" DEFAULT 'general',
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )`,

      // SDKs
      `CREATE TABLE "sdks" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "language" varchar,
        "repo_url" varchar,
        "version" varchar,
        "description" text,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )`,

      // Pages (main content collection)
      `CREATE TABLE "pages" (
        "id" serial PRIMARY KEY,
        "title" varchar,
        "slug" varchar,
        "description" varchar,
        "type" "enum_pages_type" DEFAULT 'docs',
        "content" jsonb,
        "markdown_content" varchar,
        "seo_meta_title" varchar,
        "seo_meta_description" varchar,
        "seo_og_image_id" integer,
        "source" varchar,
        "last_synced" timestamp(3) with time zone,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "_status" "enum_pages_status" DEFAULT 'published'
      )`,

      // Pages versions
      `CREATE TABLE "_pages_v" (
        "id" serial PRIMARY KEY,
        "parent_id" integer,
        "version_title" varchar,
        "version_slug" varchar,
        "version_description" varchar,
        "version_type" "enum__pages_v_version_type" DEFAULT 'docs',
        "version_content" jsonb,
        "version_markdown_content" varchar,
        "version_seo_meta_title" varchar,
        "version_seo_meta_description" varchar,
        "version_seo_og_image_id" integer,
        "version_source" varchar,
        "version_last_synced" timestamp(3) with time zone,
        "version_updated_at" timestamp(3) with time zone,
        "version_created_at" timestamp(3) with time zone,
        "version__status" "enum__pages_v_version_status" DEFAULT 'draft',
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "latest" boolean
      )`,

      // Payload system tables
      `CREATE TABLE "payload_locked_documents" (
        "id" serial PRIMARY KEY,
        "global_slug" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )`,

      `CREATE TABLE "payload_preferences" (
        "id" serial PRIMARY KEY,
        "key" varchar,
        "value" jsonb,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )`,

      `CREATE TABLE "payload_migrations" (
        "id" serial PRIMARY KEY,
        "name" varchar,
        "batch" numeric,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )`,
    ];

    for (const sql of statements) {
      const name = sql.match(/CREATE TABLE "(\w+)"/)?.[1] || "unknown";
      try {
        await drizzle.execute(sql);
        results.push(`OK: ${name}`);
      } catch (err: any) {
        results.push(`ERR: ${name} — ${err?.message?.substring(0, 120)}`);
      }
    }

    // Create indexes
    const indexes = [
      `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email")`,
      `CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" ("updated_at")`,
      `CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" ("filename")`,
      `CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" ("updated_at")`,
      `CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "faqs_updated_at_idx" ON "faqs" ("updated_at")`,
      `CREATE INDEX IF NOT EXISTS "faqs_created_at_idx" ON "faqs" ("created_at")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "sdks_slug_idx" ON "sdks" ("slug")`,
      `CREATE INDEX IF NOT EXISTS "sdks_updated_at_idx" ON "sdks" ("updated_at")`,
      `CREATE INDEX IF NOT EXISTS "sdks_created_at_idx" ON "sdks" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" ("slug")`,
      `CREATE INDEX IF NOT EXISTS "pages_updated_at_idx" ON "pages" ("updated_at")`,
      `CREATE INDEX IF NOT EXISTS "pages_created_at_idx" ON "pages" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "pages__status_idx" ON "pages" ("_status")`,
      `CREATE INDEX IF NOT EXISTS "_pages_v_parent_idx" ON "_pages_v" ("parent_id")`,
      `CREATE INDEX IF NOT EXISTS "_pages_v_version_slug_idx" ON "_pages_v" ("version_slug")`,
      `CREATE INDEX IF NOT EXISTS "_pages_v_created_at_idx" ON "_pages_v" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "_pages_v_updated_at_idx" ON "_pages_v" ("updated_at")`,
      `CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" ("updated_at")`,
      `CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" ("key")`,
      `CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" ("updated_at")`,
      `CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" ("created_at")`,
      `CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" ("updated_at")`,
      `CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" ("created_at")`,
    ];

    for (const sql of indexes) {
      try {
        await drizzle.execute(sql);
      } catch { /* skip */ }
    }
    results.push("Indexes created");

    // Final table count
    const allTables = await drizzle.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );

    return NextResponse.json({
      message: "Core tables created",
      results,
      tables: (allTables.rows || allTables).map((r: any) => r.table_name),
      tableCount: (allTables.rows || allTables).length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 8) },
      { status: 500 }
    );
  }
}
