import { NextRequest, NextResponse } from "next/server";
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

    const basicAuth = Buffer.from(`${email}:${password}`).toString("base64");
    const apiUrl = getRainbowApiUrl();

    const res = await fetch(
      `${apiUrl}/api/rainbow/authentication/v1.0/login`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Basic ${basicAuth}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      let body: Record<string, string> = {};
      try { body = JSON.parse(text); } catch {}
      console.error("Rainbow login failed:", res.status, text);
      return NextResponse.json(
        {
          error: body.errorMsg || body.errorDetails || `Login failed (${res.status})`,
          debug: { status: res.status, url: `${apiUrl}/api/rainbow/authentication/v1.0/login`, response: text.slice(0, 500) },
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
