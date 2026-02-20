/**
 * Parses all downloaded OpenAPI/Swagger specs and generates a compact
 * api-summary.json consumed by the Next.js API reference pages.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OPENAPI_DIR = path.resolve(__dirname, "../content/openapi");
const OUT_FILE = path.join(OPENAPI_DIR, "api-summary.json");

const API_PORTALS = [
  { file: "authentication.json", slug: "authentication", label: "Authentication", tag: "Core" },
  { file: "enduser.json", slug: "enduser", label: "Enduser Portal", tag: "Core" },
  { file: "admin.json", slug: "admin", label: "Admin Portal", tag: "Admin" },
  { file: "applications.json", slug: "applications", label: "Applications", tag: "Platform" },
  { file: "subscription.json", slug: "subscription", label: "Subscription", tag: "Billing" },
  { file: "invoicing.json", slug: "invoicing", label: "Invoicing", tag: "Billing" },
  { file: "metrics.json", slug: "metrics", label: "Metrics", tag: "Analytics" },
  { file: "ngcpprovisioning.json", slug: "ngcpprovisioning", label: "Voice / CloudPBX", tag: "Telephony" },
];

function parseSpec(filePath) {
  const spec = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const endpoints = [];
  const tagSet = new Set();
  const methodCounts = {};

  const paths = spec.paths || {};
  for (const [pathStr, ops] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(ops)) {
      if (!["get", "post", "put", "delete", "patch"].includes(method)) continue;
      const m = method.toUpperCase();
      methodCounts[m] = (methodCounts[m] || 0) + 1;

      const opTags = op.tags || ["Other"];
      opTags.forEach((t) => tagSet.add(t));

      endpoints.push({
        method: m,
        path: pathStr,
        summary: op.summary || op.operationId || "",
        description: (op.description || "").slice(0, 200),
        tag: opTags[0],
        deprecated: !!op.deprecated,
      });
    }
  }

  return {
    title: spec.info?.title || "",
    description: (spec.info?.description || "").slice(0, 300),
    version: spec.info?.version || "",
    specFormat: spec.openapi || spec.swagger || "",
    basePath: spec.basePath || spec.servers?.[0]?.url || "",
    endpointCount: endpoints.length,
    methodCounts,
    tags: [...tagSet].sort(),
    endpoints,
  };
}

const summary = {};
let totalEndpoints = 0;

for (const portal of API_PORTALS) {
  const filePath = path.join(OPENAPI_DIR, portal.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`  SKIP ${portal.file} — not found`);
    continue;
  }
  const parsed = parseSpec(filePath);
  totalEndpoints += parsed.endpointCount;

  summary[portal.slug] = {
    slug: portal.slug,
    label: portal.label,
    category: portal.tag,
    ...parsed,
  };

  console.log(`  ${portal.label}: ${parsed.endpointCount} endpoints (v${parsed.version})`);
}

fs.writeFileSync(OUT_FILE, JSON.stringify(summary, null, 2));
console.log(`\nWrote ${OUT_FILE}`);
console.log(`Total: ${totalEndpoints} endpoints across ${Object.keys(summary).length} APIs`);
