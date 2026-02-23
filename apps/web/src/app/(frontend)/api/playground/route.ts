import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const RAINBOW_API_URL =
  process.env.RAINBOW_API_URL || "https://openrainbow.com";

const ALLOWED_HOSTS = [
  "openrainbow.com",
  "sandbox.openrainbow.com",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("rainbow_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in first." },
        { status: 401 }
      );
    }

    const { method, url, headers: reqHeaders, body } = await req.json();

    if (!method || !url) {
      return NextResponse.json(
        { error: "method and url are required" },
        { status: 400 }
      );
    }

    // Build the full URL — if the user sent a relative path, prepend the base
    const fullUrl = url.startsWith("http") ? url : `${RAINBOW_API_URL}${url}`;

    if (!isAllowedUrl(fullUrl)) {
      return NextResponse.json(
        { error: "Only openrainbow.com and sandbox.openrainbow.com URLs are allowed" },
        { status: 403 }
      );
    }

    const outHeaders: Record<string, string> = {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    };

    // Merge user-supplied headers (skip auth-related ones for security)
    if (reqHeaders && typeof reqHeaders === "object") {
      for (const [key, value] of Object.entries(reqHeaders)) {
        const lower = key.toLowerCase();
        if (lower === "authorization" || lower === "cookie") continue;
        if (typeof value === "string" && value.trim()) {
          outHeaders[lower] = value;
        }
      }
    }

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: outHeaders,
      cache: "no-store",
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
      if (!outHeaders["content-type"]) {
        outHeaders["content-type"] = "application/json";
      }
    }

    const start = Date.now();
    const res = await fetch(fullUrl, fetchOptions);
    const duration = Date.now() - start;

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody: unknown;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      responseBody = await res.json().catch(() => null);
    } else {
      responseBody = await res.text().catch(() => "");
    }

    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
