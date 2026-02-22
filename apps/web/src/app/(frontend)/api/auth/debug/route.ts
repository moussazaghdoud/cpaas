import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRainbowApiUrl } from "@/lib/rainbow-api";

/** Temporary debug endpoint — shows raw Rainbow API user response */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("rainbow_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No rainbow_token cookie" });
  }

  const apiUrl = getRainbowApiUrl();
  const res = await fetch(`${apiUrl}/api/rainbow/enduser/v1.0/users/me`, {
    headers: { accept: "application/json", authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Rainbow API error", status: res.status });
  }

  const raw = await res.json();
  const data = raw.data || raw;

  return NextResponse.json({
    id: data.id,
    loginEmail: data.loginEmail,
    firstName: data.firstName,
    lastName: data.lastName,
    displayName: data.displayName,
    nickName: data.nickName,
    jid_im: data.jid_im,
    emails: data.emails,
    companyName: data.companyName,
    _topKeys: Object.keys(raw),
    _userKeys: Object.keys(data),
  });
}
