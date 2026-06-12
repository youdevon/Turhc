import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { getClientIp, getUserAgent, logAudit } from "./audit";
import { formatAdminRole } from "./admin-greeting";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        const requestHeaders = req?.headers ?? {};
        const ip = getClientIp(requestHeaders);
        const userAgent = getUserAgent(requestHeaders);

        if (!user || user.status !== "ACTIVE") {
          await logAudit({
            actor: { name: email, email, role: "Staff" },
            action: "Login Failed",
            outcome: "Failed",
            failReason: "Invalid credentials or inactive user account",
            ipAddress: ip,
            userAgent,
            request: { headers: requestHeaders },
          });
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await logAudit({
            actor: {
              userId: user.id,
              name: user.name,
              email: user.email,
              role: formatAdminRole(user.role.name),
            },
            action: "Login Failed",
            target: { type: "User", name: user.name, id: user.id },
            outcome: "Failed",
            failReason: "Invalid credentials",
            ipAddress: ip,
            userAgent,
            request: { headers: requestHeaders },
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await logAudit({
          actor: {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: formatAdminRole(user.role.name),
          },
          action: "Logged In",
          outcome: "Success",
          ipAddress: ip,
          userAgent,
          request: { headers: requestHeaders },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
