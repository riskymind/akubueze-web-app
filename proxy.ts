import withAuth from "next-auth/middleware";
import type { NextRequest } from "next/server";

const authMiddleware = withAuth({
  pages: { signIn: "/login" },
});

export default function proxy(req: NextRequest) {
  return authMiddleware(req as never, {} as never);
}

export const config = {
  // Protect everything except the login page, next-auth's own routes,
  // the minutes file API (does its own auth check), the UploadThing route
  // (does its own auth check in the FileRouter middleware, and also needs to
  // accept UploadThing's own callback requests, which carry no session
  // cookie), and static assets.
  matcher: [
    "/((?!login|api/auth|api/minutes|api/uploadthing|_next/static|_next/image|favicon.ico).*)",
  ],
};
