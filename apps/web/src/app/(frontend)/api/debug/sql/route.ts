import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "SELECT count(*) FROM pages";

  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const drizzle = (payload.db as any).drizzle;
    const result = await drizzle.execute(q);
    return NextResponse.json({ query: q, result: result.rows || result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
