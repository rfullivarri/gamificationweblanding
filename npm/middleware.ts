import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ["/", "/api/health", "/sign-in(.*)", "/sign-up(.*)"],
  ignoredRoutes: [
    // Skip static assets so Clerk does not log warnings about skipped middleware
    "/((?!api|trpc).*)\\..+",
    "/_next/:path*",
    "/images/:path*"
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"]
};
