import { NextResponse } from "next/server";
import { rainbowFetch } from "@/lib/rainbow-api";

export async function GET() {
  try {
    const res = await rainbowFetch(
      "/api/rainbow/enduser/v1.0/users/me"
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await res.json();

    // Try multiple fields to find the email
    const email =
      data.loginEmail ||
      (data.emails && data.emails[0]?.email) ||
      (data.jid_im ? data.jid_im.split("@")[0] + "@" + data.jid_im.split("@")[1]?.replace(/^[^.]+\./, "") : "") ||
      "";

    return NextResponse.json({
      user: {
        id: data.id,
        loginEmail: email,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        displayName: data.displayName || data.nickName || "",
        companyId: data.companyId || "",
        companyName: data.companyName || "",
        jid_im: data.jid_im || "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
