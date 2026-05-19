import { NextResponse, type NextRequest } from "next/server";
import { unsealData } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const cookie = req.cookies.get(sessionOptions.cookieName)?.value;
  let isAdmin = false;
  if (cookie) {
    try {
      // iron-session cookies are sealed with @hapi/iron — same format as
      // unsealData. We unseal directly so we don't depend on the
      // CookieStore-shaped API differing between request/response jars.
      const data = await unsealData<SessionData>(cookie, {
        password: sessionOptions.password as string,
      });
      isAdmin = Boolean(data?.admin);
    } catch {
      isAdmin = false;
    }
  }

  if (!isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Only result entry/clear is admin-gated. Teams + schedule are public.
  matcher: ["/admin/matches/:path*"],
};
