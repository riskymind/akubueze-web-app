export { default } from "next-auth/middleware";

export const config = {
  // Protect everything except the login page, next-auth's own routes,
  // the minutes file API (does its own auth check), and static assets.
  matcher: [
    "/((?!login|api/auth|api/minutes|_next/static|_next/image|favicon.ico).*)",
  ],
};
