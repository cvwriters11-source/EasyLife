import { loginAccount } from "@/lib/accounts";
import { setUserCookie } from "@/lib/user-session";

const misses = new Map<string, { count: number; until: number }>();

function caller(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const key = caller(request);
  const prior = misses.get(key);
  if (prior && prior.until > Date.now()) {
    return Response.json({ error: "wait" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const account = await loginAccount(body?.email?.toString() ?? "", body?.password?.toString() ?? "");
  if (!account) {
    const count = (prior && prior.until <= Date.now() ? 0 : prior?.count ?? 0) + 1;
    misses.set(key, { count, until: count >= 8 ? Date.now() + 60_000 : 0 });
    return Response.json({ error: "wrong" }, { status: 401 });
  }

  misses.delete(key);
  await setUserCookie(account.id);
  return Response.json({ account });
}
