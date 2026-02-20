import { NextRequest, NextResponse } from "next/server";
import { rainbowFetch } from "@/lib/rainbow-api";

// Allowlist of Rainbow API path prefixes this proxy can access
const ALLOWED_PREFIXES = [
  "subscription/",
  "enduser/",
];

function isAllowed(path: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

type Params = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: Params) {
  return proxyRequest(req, await params);
}

export async function PUT(req: NextRequest, { params }: Params) {
  return proxyRequest(req, await params, "PUT");
}

export async function POST(req: NextRequest, { params }: Params) {
  return proxyRequest(req, await params, "POST");
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return proxyRequest(req, await params, "DELETE");
}

async function proxyRequest(
  req: NextRequest,
  { path }: { path: string[] },
  method?: string
) {
  try {
    // path segments after /api/rainbow/ e.g. ["subscription", "v1.0", "companies", ...]
    const subPath = path.join("/");

    if (!isAllowed(subPath)) {
      return NextResponse.json(
        { error: "Path not allowed" },
        { status: 403 }
      );
    }

    const rainbowPath = `/api/rainbow/${subPath}`;
    const qs = req.nextUrl.searchParams.toString();
    const fullPath = qs ? `${rainbowPath}?${qs}` : rainbowPath;

    const fetchOptions: RequestInit = {
      method: method || req.method,
    };

    if (method === "PUT" || method === "POST") {
      const body = await req.text();
      if (body) {
        fetchOptions.body = body;
        fetchOptions.headers = { "content-type": "application/json" };
      }
    }

    const res = await rainbowFetch(fullPath, fetchOptions);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.errorMsg || data.errorDetails || "Request failed" },
        { status: res.status }
      );
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
