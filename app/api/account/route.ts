import { findAccount } from "@/lib/accounts";
import { readUserId } from "@/lib/user-session";

export async function GET() {
  const id = await readUserId();
  if (!id) return Response.json({ account: null }, { status: 401 });
  const account = await findAccount(id);
  if (!account) return Response.json({ account: null }, { status: 401 });
  return Response.json({ account });
}
