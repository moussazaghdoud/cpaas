import * as fs from "fs";
import * as path from "path";

// Find the content directory — try multiple possible locations
function findContentDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "../../content"),     // from apps/web
    path.resolve(process.cwd(), "../content"),         // from apps
    path.resolve(process.cwd(), "content"),            // from repo root
    path.resolve(process.cwd(), "apps/web/../../content"), // fallback
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "mdx"))) return dir;
  }
  return candidates[0]; // default even if not found
}

const CONTENT_DIR = findContentDir();
const MDX_DIR = path.join(CONTENT_DIR, "mdx");
const SEARCH_DIR = path.join(CONTENT_DIR, "search-index");


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
