import type { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((request: NextAuthRequest) => {
  if (request.nextUrl.pathname === "/admin") {
    return NextResponse.next();
  }

  if (!request.auth) {
    const redirectUrl = new URL("/admin", request.nextUrl);
    redirectUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
