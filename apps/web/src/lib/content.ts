import * as fs from "fs";
import * as path from "path";

// Resolve content dir relative to this file's location (works in both dev and build)
const CONTENT_DIR = path.resolve(process.cwd(), "../../content");
const MDX_DIR = path.join(CONTENT_DIR, "mdx");
const SEARCH_DIR = path.join(CONTENT_DIR, "search-index");

// Debug: log at build time
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  // Only log in dev
}


export interface ContentMeta {
  title: string;
  description: string;
  type: string;
  source: string;
  lastSynced: string;
}

export interface ContentPage {
  slug: string;
  meta: ContentMeta;
  content: string;
}

/** Parse frontmatter from MDX content */
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

/** List all available MDX content pages */
export function listContentPages(): ContentPage[] {
  if (!fs.existsSync(MDX_DIR)) return [];

  const files = fs.readdirSync(MDX_DIR).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(MDX_DIR, file), "utf-8");
    const { meta, content } = parseFrontmatter(raw);
    return {
      slug: file.replace(".mdx", "").replace(/__/g, "/"),
      meta: meta as unknown as ContentMeta,
      content,
    };
  });
}

/** Get a single content page by slug */
export function getContentPage(slug: string): ContentPage | null {
  const filename = slug.replace(/\//g, "__") + ".mdx";
  const filepath = path.join(MDX_DIR, filename);

  if (!fs.existsSync(filepath)) return null;

  const raw = fs.readFileSync(filepath, "utf-8");
  const { meta, content } = parseFrontmatter(raw);
  return {
    slug,
    meta: meta as unknown as ContentMeta,
    content,
  };
}

/** Get search documents */
export function getSearchDocuments(): Array<{
  id: string;
  title: string;
  path: string;
  excerpt: string;
  type: string;
  content: string;
}> {
  const docsPath = path.join(SEARCH_DIR, "documents.json");
  if (!fs.existsSync(docsPath)) return [];

  try {
    return JSON.parse(fs.readFileSync(docsPath, "utf-8"));
  } catch {
    return [];
  }
}
