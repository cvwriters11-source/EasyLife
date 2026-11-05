import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const adminCookie = "easylife_admin";

function password() {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function adminConfigured() {
  return password().length > 0;
}

export function passwordMatches(input: string) {
  const expected = password();
  if (!expected || !input) return false;
  const given = Buffer.from(input);
  const real = Buffer.from(expected);
  if (given.length !== real.length) return false;
  return timingSafeEqual(given, real);
}

function sessionToken() {
  const expected = password();
  if (!expected) return "";
  return createHmac("sha256", expected).update("easylife-admin-session").digest("hex");
}

export async function isAdmin() {
  const token = sessionToken();
  if (!token) return false;
  const jar = await cookies();
  const value = jar.get(adminCookie)?.value ?? "";
  const given = Buffer.from(value);
  const real = Buffer.from(token);
  if (given.length !== real.length) return false;
  return timingSafeEqual(given, real);
}

export async function setAdminCookie() {
  const token = sessionToken();
  const jar = await cookies();
  jar.set(adminCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(adminCookie);
}
