import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { getClientIp, getUserAgent, writeAuditLog } from "./audit";
import { setAuditContext, clearAuditContext } from "./audit-extension";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/login",
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
        const requestHeaders = req?.headers ?? {};
        const ip = getClientIp(requestHeaders);
        const userAgent = getUserAgent(requestHeaders);

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user || user.status !== "ACTIVE") {
          await writeAuditLog({
            action: "AUTH.LOGIN_FAILED",
            entityType: "User",
            after: { email, reason: "Invalid credentials or inactive account" },
            ip,
            userAgent,
          });
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await writeAuditLog({
            actorId: user.id,
            action: "AUTH.LOGIN_FAILED",
            entityType: "User",
            entityId: user.id,
            after: { reason: "Invalid password" },
            ip,
            userAgent,
          });
          return null;
        }

        setAuditContext({ actorId: user.id, ip, userAgent });
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        } finally {
          clearAuditContext();
        }

        await writeAuditLog({
          actorId: user.id,
          action: "AUTH.LOGIN",
          entityType: "User",
          entityId: user.id,
          ip,
          userAgent,
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
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

export function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
