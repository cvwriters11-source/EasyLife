import { adminConfigured, passwordMatches, setAdminCookie } from "@/lib/admin-auth";

const misses = new Map<string, { count: number; until: number }>();

function caller(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return Response.json({ error: "unset" }, { status: 503 });
  }

  const key = caller(request);
  const prior = misses.get(key);
  if (prior && prior.until > Date.now()) {
    return Response.json({ error: "wait" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!passwordMatches(body?.password?.toString() ?? "")) {
    const count = (prior && prior.until <= Date.now() ? 0 : prior?.count ?? 0) + 1;
    misses.set(key, { count, until: count >= 8 ? Date.now() + 60_000 : 0 });
    return Response.json({ error: "wrong" }, { status: 401 });
  }

  misses.delete(key);
  await setAdminCookie();
  return Response.json({ ok: true });
}
