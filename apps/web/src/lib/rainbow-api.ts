import { cookies } from "next/headers";

const RAINBOW_API_URL =
  process.env.RAINBOW_API_URL || "https://openrainbow.com";

export async function rainbowFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get("rainbow_token")?.value;

  const headers: Record<string, string> = {
    accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["content-type"]
  ) {
    headers["content-type"] = "application/json";
  }

  return fetch(`${RAINBOW_API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}

export function getRainbowApiUrl(): string {
  return RAINBOW_API_URL;
}
