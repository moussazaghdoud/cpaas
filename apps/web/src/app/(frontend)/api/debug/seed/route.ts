import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const maxDuration = 300; // 5 min timeout for seeding

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";

  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();

    if (action === "globals") {
      // Seed Navigation, Footer, SiteConfig globals
      const results: string[] = [];

      // Navigation
      try {
        await payload.updateGlobal({
          slug: "navigation",
          data: {
            items: [
              { label: "Docs", url: "/docs" },
              { label: "API Reference", url: "/api-reference" },
              { label: "SDKs", url: "/docs/sdk" },
              { label: "Support", url: "/support" },
            ],
          },
        });
        results.push("OK: Navigation seeded (4 items)");
      } catch (err: any) {
        results.push("ERR: Navigation — " + err?.message?.substring(0, 100));
      }

      // Footer
      try {
        await payload.updateGlobal({
          slug: "footer",
          data: {
            sections: [
              {
                title: "Product",
                links: [
                  { label: "Overview", url: "/" },
                  { label: "Documentation", url: "/docs" },
                  { label: "API Reference", url: "/api-reference" },
                  { label: "SDKs", url: "/docs/sdk" },
                  { label: "Changelog", url: "/changelog" },
                ],
              },
              {
                title: "Developers",
                links: [
                  { label: "Getting Started", url: "/get-started" },
                  { label: "Guides", url: "/docs/guides" },
                  { label: "API Keys", url: "/portal/applications" },
                  { label: "Sandbox", url: "/portal/sandbox" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About Rainbow", url: "https://www.al-enterprise.com/rainbow", external: true },
                  { label: "Support", url: "/support" },
                  { label: "Legal", url: "/legal" },
                  { label: "Privacy", url: "/legal/privacy" },
                ],
              },
            ],
          },
        });
        results.push("OK: Footer seeded (3 sections)");
      } catch (err: any) {
        results.push("ERR: Footer — " + err?.message?.substring(0, 100));
      }

      // SiteConfig
      try {
        await payload.updateGlobal({
          slug: "site-config",
          data: {
            siteName: "Rainbow",
            siteUrl: "https://developers.rainbow.com",
            description: "Add communications to your apps with Rainbow CPaaS. Messaging, voice, video conferencing, and more through simple APIs and SDKs.",
          },
        });
        results.push("OK: SiteConfig seeded");
      } catch (err: any) {
        results.push("ERR: SiteConfig — " + err?.message?.substring(0, 100));
      }

      return NextResponse.json({ message: "Globals seeded", results });
    }

    if (action === "sdks") {
      const sdks = [
        { name: "Node.js SDK", slug: "node", language: "JavaScript/TypeScript" },
        { name: "Web SDK", slug: "web", language: "JavaScript" },
        { name: "Web SDK v2", slug: "webv2", language: "JavaScript/TypeScript" },
        { name: "Android SDK", slug: "android", language: "Java/Kotlin" },
        { name: "iOS SDK", slug: "ios", language: "Swift/Objective-C" },
        { name: "C# SDK", slug: "csharp", language: "C#/.NET" },
        { name: "React Native SDK", slug: "reactnative", language: "JavaScript/TypeScript" },
        { name: "CLI SDK", slug: "cli", language: "Command Line" },
        { name: "S2S Starter Kit", slug: "s2s-starterkit-nodejs", language: "Node.js" },
      ];

      const results: string[] = [];
      for (const sdk of sdks) {
        try {
          // Check if exists
          const existing = await payload.find({
            collection: "sdks",
            where: { slug: { equals: sdk.slug } },
            limit: 1,
          });
          if (existing.docs.length > 0) {
            results.push("SKIP: " + sdk.name + " (exists)");
            continue;
          }
          await payload.create({ collection: "sdks", data: sdk });
          results.push("OK: " + sdk.name);
        } catch (err: any) {
          results.push("ERR: " + sdk.name + " — " + err?.message?.substring(0, 100));
        }
      }
      return NextResponse.json({ message: "SDKs seeded", results });
    }

    if (action === "pages") {
      // Find MDX content directory
      const candidates = [
        path.resolve(process.cwd(), "../../content/mdx"),
        path.resolve(process.cwd(), "../content/mdx"),
        path.resolve(process.cwd(), "content/mdx"),
      ];
      let mdxDir = "";
      for (const dir of candidates) {
        if (fs.existsSync(dir)) { mdxDir = dir; break; }
      }

      if (!mdxDir) {
        return NextResponse.json({ error: "MDX directory not found", tried: candidates });
      }

      const files = fs.readdirSync(mdxDir).filter((f) => f.endsWith(".mdx"));
      const results: string[] = [];
      let created = 0;
      let skipped = 0;
      let errors = 0;

      for (const file of files) {
        const slug = file.replace(".mdx", "").replace(/__/g, "/");
        try {
          // Check if exists
          const existing = await payload.find({
            collection: "pages",
            where: { slug: { equals: slug } },
            limit: 1,
          });
          if (existing.docs.length > 0) {
            skipped++;
            continue;
          }

          const raw = fs.readFileSync(path.join(mdxDir, file), "utf-8");
          const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
          const meta: Record<string, string> = {};
          let content = raw;

          if (match) {
            for (const line of match[1].split("\n")) {
              const [key, ...rest] = line.split(": ");
              if (key && rest.length > 0) {
                meta[key.trim()] = rest.join(": ").replace(/^"(.*)"$/, "$1");
              }
            }
            content = match[2];
          }

          // Determine page type
          let type = "docs";
          if (slug.startsWith("api/") || slug.includes("api-reference")) type = "api-reference";
          else if (slug.includes("guide")) type = "guide";
          else if (slug.startsWith("doc/sdk") || slug.startsWith("docs/sdk")) type = "sdk";
          else if (slug.includes("faq")) type = "faq";
          else if (slug.includes("changelog") || slug.includes("release")) type = "changelog";

          await payload.create({
            collection: "pages",
            data: {
              title: meta.title || slug.split("/").pop() || slug,
              slug,
              description: meta.description || "",
              type,
              markdownContent: content,
              source: meta.source || "",
              _status: "published",
            },
          });
          created++;
        } catch (err: any) {
          errors++;
          if (results.length < 10) {
            results.push("ERR: " + slug + " — " + err?.message?.substring(0, 100));
          }
        }
      }

      return NextResponse.json({
        message: "Pages seeded",
        totalFiles: files.length,
        created,
        skipped,
        errors,
        sampleErrors: results,
        mdxDir,
      });
    }

    if (action === "all") {
      // Redirect to run globals, sdks, then pages in sequence
      const baseUrl = url.origin + url.pathname;
      const globalsRes = await fetch(baseUrl + "?action=globals");
      const sdksRes = await fetch(baseUrl + "?action=sdks");
      const pagesRes = await fetch(baseUrl + "?action=pages");

      return NextResponse.json({
        globals: await globalsRes.json(),
        sdks: await sdksRes.json(),
        pages: await pagesRes.json(),
      });
    }

    // Status
    const pageCount = await payload.count({ collection: "pages" });
    const sdkCount = await payload.count({ collection: "sdks" });

    return NextResponse.json({
      availableActions: ["?action=globals", "?action=sdks", "?action=pages", "?action=all"],
      currentCounts: { pages: pageCount.totalDocs, sdks: sdkCount.totalDocs },
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err?.message, stack: err?.stack?.split("\n").slice(0, 8) },
      { status: 500 }
    );
  }
}
