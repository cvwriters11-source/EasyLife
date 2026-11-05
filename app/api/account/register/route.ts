import { registerAccount } from "@/lib/accounts";
import { setUserCookie } from "@/lib/user-session";

function clip(value: unknown, max: number) {
  return value?.toString().trim().slice(0, max) ?? "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
    firstName?: string;
    surname?: string;
    age?: string;
    marriageStatus?: string;
    location?: string;
    phone?: string;
    message?: string;
  } | null;

  const email = clip(body?.email, 160);
  const password = body?.password?.toString() ?? "";
  const age = Number(clip(body?.age, 8));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "email" }, { status: 400 });
  }
  if (password.length < 8 || password.length > 80) {
    return Response.json({ error: "password" }, { status: 400 });
  }
  if (clip(body?.firstName, 80).length < 2 || clip(body?.surname, 80).length < 2) {
    return Response.json({ error: "name" }, { status: 400 });
  }
  if (!Number.isInteger(age) || age < 18 || age > 120) {
    return Response.json({ error: "adults" }, { status: 403 });
  }

  const result = await registerAccount({
    email,
    password,
    firstName: clip(body?.firstName, 80),
    surname: clip(body?.surname, 80),
    age: String(age),
    marriageStatus: clip(body?.marriageStatus, 80),
    location: clip(body?.location, 120),
    phone: clip(body?.phone, 40),
    message: clip(body?.message, 4000),
  });

  if ("error" in result) {
    return Response.json({ error: "exists" }, { status: 409 });
  }

  await setUserCookie(result.account.id);
  return Response.json({ account: result.account });
}
