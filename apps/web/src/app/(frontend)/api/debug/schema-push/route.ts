import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";

  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const db = payload.db as any;
    const drizzle = db.drizzle;

    if (action === "create-enums-and-tables") {
      const results: string[] = [];

      // Step 1: Create all enum types
      const enums = [
        // Pages collection
        `CREATE TYPE "enum_pages_type" AS ENUM ('docs','api-reference','guide','sdk','faq','marketing','legal','changelog')`,
        `CREATE TYPE "enum_pages_status" AS ENUM ('draft','published')`,
        // Pages blocks
        `CREATE TYPE "enum_pages_blocks_hero_ctas_variant" AS ENUM ('primary','secondary')`,
        `CREATE TYPE "enum_pages_blocks_feature_grid_features_icon" AS ENUM ('message','phone','video','bot','admin','users')`,
        `CREATE TYPE "enum_pages_blocks_cta_buttons_variant" AS ENUM ('primary','secondary')`,
        `CREATE TYPE "enum_pages_blocks_code_language" AS ENUM ('javascript','typescript','python','java','kotlin','swift','csharp','shell','json','xml','html','css')`,
        // Pages versions
        `CREATE TYPE "enum__pages_v_version_type" AS ENUM ('docs','api-reference','guide','sdk','faq','marketing','legal','changelog')`,
        `CREATE TYPE "enum__pages_v_version_status" AS ENUM ('draft','published')`,
        `CREATE TYPE "enum__pages_v_blocks_hero_ctas_variant" AS ENUM ('primary','secondary')`,
        `CREATE TYPE "enum__pages_v_blocks_feature_grid_features_icon" AS ENUM ('message','phone','video','bot','admin','users')`,
        `CREATE TYPE "enum__pages_v_blocks_cta_buttons_variant" AS ENUM ('primary','secondary')`,
        `CREATE TYPE "enum__pages_v_blocks_code_language" AS ENUM ('javascript','typescript','python','java','kotlin','swift','csharp','shell','json','xml','html','css')`,
        // Homepage blocks
        `CREATE TYPE "enum_homepage_blocks_hero_ctas_variant" AS ENUM ('primary','secondary')`,
        `CREATE TYPE "enum_homepage_blocks_feature_grid_features_icon" AS ENUM ('message','phone','video','bot','admin','users')`,
        `CREATE TYPE "enum_homepage_blocks_cta_buttons_variant" AS ENUM ('primary','secondary')`,
        `CREATE TYPE "enum_homepage_blocks_code_language" AS ENUM ('javascript','typescript','python','java','kotlin','swift','csharp','shell','json','xml','html','css')`,
        // Users
        `CREATE TYPE "enum_users_role" AS ENUM ('admin','editor','viewer')`,
        // FAQs
        `CREATE TYPE "enum_faqs_category" AS ENUM ('general','getting-started','billing','technical','account')`,
      ];

      for (const sql of enums) {
        try {
          await drizzle.execute(sql);
          results.push("ENUM OK: " + sql.substring(13, 70));
        } catch (err: any) {
          if (err?.message?.includes("already exists")) {
            results.push("ENUM EXISTS: " + sql.substring(13, 70));
          } else {
            results.push("ENUM ERR: " + sql.substring(13, 70) + " — " + err?.message?.substring(0, 80));
          }
        }
      }

      // Step 2: Drop and recreate tables that failed due to missing enums
      // First drop the incorrectly-created tables that might have wrong column types
      const tablesToRecreate = [
        "pages", "users", "media", "faqs", "sdks",
        "payload_locked_documents", "payload_preferences", "payload_migrations",
        "_pages_v",
        "pages_blocks_hero_ctas", "pages_blocks_feature_grid_features",
        "pages_blocks_cta_buttons", "pages_blocks_code",
        "_pages_v_blocks_hero_ctas", "_pages_v_blocks_feature_grid_features",
        "_pages_v_blocks_cta_buttons", "_pages_v_blocks_code",
        "homepage_blocks_hero_ctas", "homepage_blocks_feature_grid_features",
        "homepage_blocks_cta_buttons", "homepage_blocks_code",
      ];

      // Don't drop — use IF NOT EXISTS. The existing tables from raw-create are fine for core columns.
      // Just create the missing tables that need enums.

      const createStatements = [
        // payload_locked_documents (uses timestamp(3) with time zone)
        `CREATE TABLE IF NOT EXISTS "payload_locked_documents" ("id" serial PRIMARY KEY, "global_slug" varchar, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS "payload_preferences" ("id" serial PRIMARY KEY, "key" varchar, "value" jsonb, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL)`,

        // Pages blocks with enums
        `CREATE TABLE IF NOT EXISTS "pages_blocks_hero_ctas" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "label" varchar, "url" varchar, "variant" "enum_pages_blocks_hero_ctas_variant" DEFAULT 'primary')`,
        `CREATE TABLE IF NOT EXISTS "pages_blocks_feature_grid_features" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "title" varchar, "description" varchar, "icon" "enum_pages_blocks_feature_grid_features_icon", "url" varchar)`,
        `CREATE TABLE IF NOT EXISTS "pages_blocks_cta_buttons" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "label" varchar, "url" varchar, "variant" "enum_pages_blocks_cta_buttons_variant" DEFAULT 'primary')`,
        `CREATE TABLE IF NOT EXISTS "pages_blocks_code" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "language" "enum_pages_blocks_code_language" DEFAULT 'javascript', "code" varchar, "title" varchar, "show_line_numbers" boolean DEFAULT false, "block_name" varchar)`,

        // Pages versions
        `CREATE TABLE IF NOT EXISTS "_pages_v" ("id" serial PRIMARY KEY, "parent_id" integer, "version_title" varchar, "version_slug" varchar, "version_description" varchar, "version_type" "enum__pages_v_version_type" DEFAULT 'docs', "version_content" jsonb, "version_markdown_content" varchar, "version_seo_meta_title" varchar, "version_seo_meta_description" varchar, "version_seo_og_image_id" integer, "version_source" varchar, "version_last_synced" timestamp(3) with time zone, "version_updated_at" timestamp(3) with time zone, "version_created_at" timestamp(3) with time zone, "version__status" "enum__pages_v_version_status" DEFAULT 'draft', "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "latest" boolean)`,
        `CREATE TABLE IF NOT EXISTS "_pages_v_blocks_hero_ctas" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "label" varchar, "url" varchar, "variant" "enum__pages_v_blocks_hero_ctas_variant" DEFAULT 'primary')`,
        `CREATE TABLE IF NOT EXISTS "_pages_v_blocks_feature_grid_features" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "title" varchar, "description" varchar, "icon" "enum__pages_v_blocks_feature_grid_features_icon", "url" varchar)`,
        `CREATE TABLE IF NOT EXISTS "_pages_v_blocks_cta_buttons" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "label" varchar, "url" varchar, "variant" "enum__pages_v_blocks_cta_buttons_variant" DEFAULT 'primary')`,
        `CREATE TABLE IF NOT EXISTS "_pages_v_blocks_code" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "language" "enum__pages_v_blocks_code_language" DEFAULT 'javascript', "code" varchar, "title" varchar, "show_line_numbers" boolean DEFAULT false, "block_name" varchar)`,

        // Homepage blocks with enums
        `CREATE TABLE IF NOT EXISTS "homepage_blocks_hero_ctas" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "label" varchar NOT NULL, "url" varchar NOT NULL, "variant" "enum_homepage_blocks_hero_ctas_variant" DEFAULT 'primary')`,
        `CREATE TABLE IF NOT EXISTS "homepage_blocks_feature_grid_features" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" varchar NOT NULL, "icon" "enum_homepage_blocks_feature_grid_features_icon", "url" varchar)`,
        `CREATE TABLE IF NOT EXISTS "homepage_blocks_cta_buttons" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "label" varchar NOT NULL, "url" varchar NOT NULL, "variant" "enum_homepage_blocks_cta_buttons_variant" DEFAULT 'primary')`,
        `CREATE TABLE IF NOT EXISTS "homepage_blocks_code" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "language" "enum_homepage_blocks_code_language" DEFAULT 'javascript' NOT NULL, "code" varchar NOT NULL, "title" varchar, "show_line_numbers" boolean DEFAULT false, "block_name" varchar)`,
      ];

      for (const sql of createStatements) {
        try {
          await drizzle.execute(sql);
          results.push("TABLE OK: " + sql.substring(30, 80));
        } catch (err: any) {
          results.push("TABLE ERR: " + sql.substring(30, 80) + " — " + err?.message?.substring(0, 100));
        }
      }

      // Step 3: Verify
      const tables = await drizzle.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      const enumTypes = await drizzle.execute(
        `SELECT typname FROM pg_type WHERE typcategory = 'E' ORDER BY typname`
      );

      return NextResponse.json({
        message: "create-enums-and-tables completed",
        results,
        tables: (tables.rows || tables).map((r: any) => r.table_name),
        tableCount: (tables.rows || tables).length,
        enums: (enumTypes.rows || enumTypes).map((r: any) => r.typname),
      });
    }

    // Default status
    const tables = await drizzle.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    return NextResponse.json({
      availableActions: ["?action=create-enums-and-tables"],
      existingTables: (tables.rows || tables).map((r: any) => r.table_name),
      tableCount: (tables.rows || tables).length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 10) },
      { status: 500 }
    );
  }
}
