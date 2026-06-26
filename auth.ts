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

        if (!adminPassword || !password || password !== adminPassword) {
          return null;
        }

        return { id: "admin", name: "Admin" };
      },
    }),
  ],
});
