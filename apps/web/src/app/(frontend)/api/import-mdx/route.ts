import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

function findMdxDir(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "../../content/mdx"),
    path.resolve(process.cwd(), "../content/mdx"),
    path.resolve(process.cwd(), "content/mdx"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(": ");
    if (key && rest.length > 0) {
      meta[key.trim()] = rest.join(": ").replace(/^"(.*)"$/, "$1");
    }
  }
  return { meta, content: match[2] };
}

export async function POST() {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();

    const mdxDir = findMdxDir();
    if (!mdxDir) {
      return NextResponse.json({ error: "MDX directory not found" }, { status: 404 });
    }

    const files = fs.readdirSync(mdxDir).filter((f) => f.endsWith(".mdx"));
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const file of files) {
      const slug = file.replace(".mdx", "");
      const raw = fs.readFileSync(path.join(mdxDir, file), "utf-8");
      const { meta, content } = parseFrontmatter(raw);

      // Check if page already exists
      const existing = await payload.find({
        collection: "pages",
        where: { slug: { equals: slug } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        skipped++;
        continue;
      }

      // Map type from frontmatter
      const validTypes = ["docs", "api-reference", "guide", "sdk", "faq", "marketing", "legal", "changelog"];
      const type = validTypes.includes(meta.type || "") ? meta.type : "docs";

      try {
        await payload.create({
          collection: "pages",
          data: {
            title: meta.title || slug.replace(/__/g, " / ").replace(/^doc ?\/ ?/, ""),
            slug,
            description: meta.description || "",
            type,
            markdownContent: content,
            source: meta.source || "",
            lastSynced: meta.lastSynced || new Date().toISOString(),
            _status: "published",
          },
        });
        imported++;
      } catch (err) {
        failed++;
        errors.push(`${slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      total: files.length,
      imported,
      skipped,
      failed,
      errors: errors.slice(0, 20),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
