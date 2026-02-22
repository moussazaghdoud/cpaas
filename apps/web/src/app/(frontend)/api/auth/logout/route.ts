import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRainbowApiUrl } from "@/lib/rainbow-api";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("rainbow_token")?.value;

    if (token) {
      const apiUrl = getRainbowApiUrl();
      // Best-effort logout on Rainbow side
      await fetch(`${apiUrl}/api/rainbow/authentication/v1.0/logout`, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }).catch(() => {});
    }

    cookieStore.delete("rainbow_token");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
