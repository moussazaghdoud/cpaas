import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rainbowFetch } from "@/lib/rainbow-api";

export async function POST() {
  try {
    const res = await rainbowFetch(
      "/api/rainbow/authentication/v1.0/renew",
      { method: "GET" }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Token renewal failed" }, { status: 401 });
    }

    const data = await res.json();
    const token = data.token;

    if (token) {
      const cookieStore = await cookies();
      cookieStore.set("rainbow_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3600,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Token renewal failed" }, { status: 401 });
  }
}
