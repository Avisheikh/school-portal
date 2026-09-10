import {
  clearSessionCookie,
  isAuthenticated,
  verifyCredentials,
  withSessionCookie,
} from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ authenticated: await isAuthenticated() });
}

export async function POST(request: Request) {
  let body: { username?: string; password?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password, action } = body;

  if (action === "logout") {
    return clearSessionCookie(NextResponse.json({ ok: true }));
  }

  if (!verifyCredentials(username || "", password || "")) {
    return NextResponse.json(
      { error: "Invalid username or password. Use admin / bodgaun2024" },
      { status: 401 },
    );
  }

  return withSessionCookie(NextResponse.json({ ok: true }));
}
