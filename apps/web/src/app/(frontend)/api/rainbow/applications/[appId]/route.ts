import { NextRequest, NextResponse } from "next/server";
import { rainbowFetch } from "@/lib/rainbow-api";

type Params = { params: Promise<{ appId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { appId } = await params;
    const res = await rainbowFetch(
      `/api/rainbow/applications/v1.0/applications/${appId}`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Application not found" },
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

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { appId } = await params;
    const body = await req.json();
    const action = req.nextUrl.searchParams.get("action");

    let path = `/api/rainbow/applications/v1.0/applications/${appId}`;
    if (action === "deploy") {
      path = `/api/rainbow/applications/v1.0/applications/${appId}/request-deploy`;
    } else if (action === "stop") {
      path = `/api/rainbow/applications/v1.0/applications/${appId}/stop`;
    }

    const res = await rainbowFetch(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.errorMsg || data.errorDetails || "Operation failed" },
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

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { appId } = await params;
    const res = await rainbowFetch(
      `/api/rainbow/applications/v1.0/applications/${appId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.errorMsg || data.errorDetails || "Delete failed" },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
