import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const password = credentials?.password as string | undefined;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const hostessPassword = process.env.HOSTESS_PASSWORD;

        if (!password) return null;

        if (adminPassword && password === adminPassword) {
          return { id: "admin", name: "Admin", role: "admin" as const };
        }

        if (hostessPassword && password === hostessPassword) {
          return { id: "hostess", name: "Hôtesse", role: "hostess" as const };
        }

        return null;
      },
    }),
  ],
});
