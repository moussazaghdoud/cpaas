import { NextRequest, NextResponse } from "next/server";
import { rainbowFetch } from "@/lib/rainbow-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const qs = searchParams.toString();
    const path = `/api/rainbow/applications/v1.0/applications${qs ? `?${qs}` : ""}`;

    const res = await rainbowFetch(path);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await rainbowFetch(
      "/api/rainbow/applications/v1.0/applications",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.errorMsg || data.errorDetails || "Failed to create application" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
