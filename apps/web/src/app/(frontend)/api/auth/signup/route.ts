import { NextRequest, NextResponse } from "next/server";
import { getRainbowApiUrl } from "@/lib/rainbow-api";

export async function POST(req: NextRequest) {
  try {
    const { loginEmail, password, firstName, lastName } = await req.json();

    if (!loginEmail || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const apiUrl = getRainbowApiUrl();

    const res = await fetch(
      `${apiUrl}/api/rainbow/enduser/v1.0/users/self-register`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          loginEmail,
          password,
          firstName,
          lastName,
        }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: body.errorMsg || body.errorDetails || "Registration failed" },
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
