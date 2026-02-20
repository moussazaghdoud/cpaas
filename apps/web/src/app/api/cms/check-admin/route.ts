import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRainbowApiUrl } from "@/lib/rainbow-api";

/** GET /api/cms/check-admin — returns { admin: true/false } */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("rainbow_token")?.value;
  if (!token) {
    return NextResponse.json({ admin: false });
  }

  const allowed = process.env.CMS_ADMIN_EMAILS;
  if (!allowed) {
    return NextResponse.json({ admin: false });
  }

  const apiUrl = getRainbowApiUrl();
  const res = await fetch(`${apiUrl}/api/rainbow/enduser/v1.0/users/me`, {
    headers: { accept: "application/json", authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ admin: false });
  }

  const raw = await res.json();
  const user = raw.data || raw;
  const email = (user.loginEmail || "").toLowerCase();
  const list = allowed.split(",").map((e) => e.trim().toLowerCase());

  return NextResponse.json({ admin: list.includes(email) });
}
