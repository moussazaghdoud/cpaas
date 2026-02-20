import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getRainbowApiUrl } from "@/lib/rainbow-api";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const appId = process.env.RAINBOW_APP_ID;
    const appSecret = process.env.RAINBOW_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: "Portal not configured: missing RAINBOW_APP_ID or RAINBOW_APP_SECRET" },
        { status: 503 }
      );
    }

    const basicAuth = Buffer.from(`${email}:${password}`).toString("base64");
    const hash = createHash("sha256")
      .update(appSecret + password)
      .digest("hex");
    const appAuth = Buffer.from(`${appId}:${hash}`).toString("base64");
    const apiUrl = getRainbowApiUrl();

    const res = await fetch(
      `${apiUrl}/api/rainbow/authentication/v1.0/login`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Basic ${basicAuth}`,
          "x-rainbow-app-auth": `Basic ${appAuth}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      let body: Record<string, string> = {};
      try { body = JSON.parse(text); } catch {}
      return NextResponse.json(
        {
          error: body.errorMsg || `Login failed (${res.status})`,
          detail: body.errorDetails || "",
          code: body.errorDetailsCode || null,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    const token = data.token;

    if (!token) {
      return NextResponse.json(
        { error: "No token received from Rainbow" },
        { status: 502 }
      );
    }

    const user = data.loggedInUser || {};

    const response = NextResponse.json({
      user: {
        id: user.id,
        loginEmail: user.loginEmail,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        companyId: user.companyId,
        companyName: user.companyName,
        jid_im: user.jid_im,
      },
    });

    response.cookies.set("rainbow_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
