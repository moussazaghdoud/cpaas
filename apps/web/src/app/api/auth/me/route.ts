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

    return NextResponse.json({
      user: {
        id: data.id,
        loginEmail: data.loginEmail || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        displayName: data.displayName || "",
        companyId: data.companyId || "",
        companyName: data.companyName || "",
        jid_im: data.jid_im || "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
