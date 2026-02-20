import * as fs from "fs";
import * as path from "path";

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  description: string;
  tag: string;
  deprecated: boolean;
}

export interface ApiPortal {
  slug: string;
  label: string;
  category: string;
  title: string;
  description: string;
  version: string;
  specFormat: string;
  basePath: string;
  endpointCount: number;
  methodCounts: Record<string, number>;
  tags: string[];
  endpoints: ApiEndpoint[];
}

let _cache: Record<string, ApiPortal> | null = null;

function findSummaryFile(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "../../content/openapi/api-summary.json"),
    path.resolve(process.cwd(), "../content/openapi/api-summary.json"),
    path.resolve(process.cwd(), "content/openapi/api-summary.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function getApiSummary(): Record<string, ApiPortal> {
  if (_cache) return _cache;
  const file = findSummaryFile();
  if (!file) return {};
  try {
    _cache = JSON.parse(fs.readFileSync(file, "utf-8"));
    return _cache!;
  } catch {
    return {};
  }
}

export function getApiPortal(slug: string): ApiPortal | null {
  const all = getApiSummary();
  return all[slug] || null;
}

export function getAllPortals(): ApiPortal[] {
  const all = getApiSummary();
  return Object.values(all);
}
