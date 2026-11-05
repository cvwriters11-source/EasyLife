import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";

export const userCookie = "easylife_user";

const secretFile = () => path.join(process.cwd(), "data", "auth-secret");

async function secret() {
  try {
    const existing = (await readFile(secretFile(), "utf8")).trim();
    if (existing) return existing;
  } catch {
    // A secret is created the first time someone creates an account.
  }
  const next = randomBytes(32).toString("hex");
  await mkdir(path.dirname(secretFile()), { recursive: true });
  await writeFile(secretFile(), next, "utf8");
  return next;
}

function sign(id: string, key: string) {
  return createHmac("sha256", key).update(id).digest("hex");
}

export async function setUserCookie(id: string) {
  const key = await secret();
  const jar = await cookies();
  jar.set(userCookie, `${id}.${sign(id, key)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearUserCookie() {
  const jar = await cookies();
  jar.delete(userCookie);
}

export async function readUserId() {
  const jar = await cookies();
  const value = jar.get(userCookie)?.value ?? "";
  const split = value.indexOf(".");
  if (split < 1) return "";
  const id = value.slice(0, split);
  const given = value.slice(split + 1);
  const key = await secret();
  const expected = sign(id, key);
  const left = Buffer.from(given);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return "";
  return id;
}
