import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const COOKIE_NAME = "ssd_session";
const SESSION_DAYS = 7;

function secret(): string {
  return process.env.ADMIN_SECRET || "ssd-bodgaun-change-me-in-production";
}

export function adminPassword(): string {
  return (process.env.ADMIN_PASSWORD || "bodgaun2024").trim();
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function verifyCredentials(username: string, password: string): boolean {
  const okUser = username.trim().toLowerCase() === "admin";
  const okPass = password.trim() === adminPassword();
  return okUser && okPass;
}

export function makeSessionToken(): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `admin:${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    secure: false,
  };
}

/** Attach session cookie onto an API response (reliable in Route Handlers). */
export function withSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, makeSessionToken(), sessionCookieOptions());
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return res;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payload || !sig) return false;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  const exp = Number(payload.split(":").pop());
  if (!exp || Date.now() > exp) return false;
  return true;
}

export async function requireAuth(): Promise<boolean> {
  return isAuthenticated();
}
