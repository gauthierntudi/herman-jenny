import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user?.role) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role === "hostess" || token.role === "admin" ? token.role : undefined;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const path = nextUrl.pathname;

      const isAdminRoute = path.startsWith("/admin") || path.startsWith("/api/admin");
      const isHostessRoute = path.startsWith("/hostess") || path.startsWith("/api/hostess");
      const isAdminLogin = path === "/admin/login";
      const isHostessLogin = path === "/hostess/login";

      if (isAdminLogin) {
        if (isLoggedIn && role === "hostess") {
          return Response.redirect(new URL("/hostess", nextUrl));
        }
        if (isLoggedIn) {
          return Response.redirect(new URL("/admin", nextUrl));
        }
        return true;
      }

      if (isHostessLogin) {
        if (isLoggedIn) {
          const next = nextUrl.searchParams.get("next") || "/hostess";
          return Response.redirect(new URL(next, nextUrl));
        }
        return true;
      }

      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        if (role === "hostess") {
          return Response.redirect(new URL("/hostess", nextUrl));
        }
        return true;
      }

      if (isHostessRoute) {
        if (!isLoggedIn) {
          if (path.startsWith("/api/")) return false;
          const login = new URL("/hostess/login", nextUrl);
          const nextPath = `${path}${nextUrl.search}`;
          if (nextPath && nextPath !== "/hostess") {
            login.searchParams.set("next", nextPath);
          }
          return Response.redirect(login);
        }
        return true;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
