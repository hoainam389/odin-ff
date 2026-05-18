import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Read-only check: copy request cookies into the response cookie jar so
  // iron-session can read them (its CookieStore shape requires the response form).
  for (const c of req.cookies.getAll()) {
    res.cookies.set(c.name, c.value);
  }
  const session = await getIronSession<SessionData>(res.cookies, sessionOptions);
  if (!session.admin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
