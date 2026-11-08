import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("better-auth.session_token") || request.cookies.get("__Secure-better-auth.session_token");
  const path = request.nextUrl.pathname;
  const publicAuth = ["/auth/reset-password", "/auth/forgot-password", "/tenant/sign-in", "/tenant/accept-invite"];
  if (publicAuth.some((route) => path.startsWith(route))) return NextResponse.next();
  if ((path.startsWith("/dashboard") || path.startsWith("/tenant/dashboard")) && !token?.value) {
    return NextResponse.redirect(new URL(path.startsWith("/tenant") ? "/tenant/sign-in" : "/auth/sign-in", request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*", "/tenant/:path*", "/auth/:path*"] };
