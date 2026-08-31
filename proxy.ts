export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/hostess",
    "/hostess/:path*",
    "/api/admin/:path*",
    "/api/hostess/:path*",
  ],
};
