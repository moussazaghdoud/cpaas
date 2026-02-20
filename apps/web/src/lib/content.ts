import * as fs from "fs";
import * as path from "path";

// Find the content directory — prefer persistent volume, then build-time paths
function findContentDir(): string {
  const volumePath = process.env.CONTENT_VOLUME_PATH;
  if (volumePath) {
    const volumeMdx = path.join(volumePath, "content", "mdx");
    if (fs.existsSync(volumeMdx)) return path.join(volumePath, "content");
  }

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

/** Return the build-time content directory (used for seeding) */
export function findBuildTimeContentDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "../../content"),
    path.resolve(process.cwd(), "../content"),
    path.resolve(process.cwd(), "content"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "mdx"))) return dir;
  }
  return candidates[0];
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

/** Build frontmatter string from meta object */
function buildFrontmatter(meta: Record<string, string>): string {
  const lines = Object.entries(meta)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}: "${v}"`);
  return `---\n${lines.join("\n")}\n---\n`;
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

/** Save (create or update) a content page */
export function saveContentPage(
  slug: string,
  meta: Partial<ContentMeta>,
  content: string
): void {
  if (!fs.existsSync(MDX_DIR)) {
    fs.mkdirSync(MDX_DIR, { recursive: true });
  }

  const filename = slug.replace(/\//g, "__") + ".mdx";
  const filepath = path.join(MDX_DIR, filename);

  const frontmatter: Record<string, string> = {};
  if (meta.title) frontmatter.title = meta.title;
  if (meta.description) frontmatter.description = meta.description;
  if (meta.type) frontmatter.type = meta.type;
  if (meta.source) frontmatter.source = meta.source;
  frontmatter.lastSynced = new Date().toISOString();

  const raw = buildFrontmatter(frontmatter) + content;
  fs.writeFileSync(filepath, raw, "utf-8");
}

/** Delete a content page */
export function deleteContentPage(slug: string): boolean {
  const filename = slug.replace(/\//g, "__") + ".mdx";
  const filepath = path.join(MDX_DIR, filename);

  if (!fs.existsSync(filepath)) return false;
  fs.unlinkSync(filepath);
  return true;
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
