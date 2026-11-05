import { clearUserCookie } from "@/lib/user-session";

export async function POST() {
  await clearUserCookie();
  return Response.json({ ok: true });
}
