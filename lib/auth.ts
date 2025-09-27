import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Session } from "next-auth";
import type { CredentialsConfig, CredentialInput } from "next-auth/providers/credentials";
import type { AdapterUser } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const authSecret =
  process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? (process.env.NODE_ENV === "development" ? "dev-secret" : undefined);

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type MutableToken = Record<string, unknown> & { id?: unknown; role?: unknown };

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/sign-in",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: (async (
        rawCredentials: Record<string, string> | undefined,
        _req: unknown,
      ) => {
        void _req;
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          throw new Error("กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง");
        }
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
          throw new Error("ไม่พบผู้ใช้งาน");
        }
        const match = await compare(password, user.passwordHash);
        if (!match) {
          throw new Error("รหัสผ่านไม่ถูกต้อง");
        }
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await prisma.auditTrail.create({
          data: {
            actorId: user.id,
            action: "LOGIN",
            entityId: user.id,
            entityType: "user",
          },
        });
        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          role: user.role,
        };
      }) as unknown as CredentialsConfig<Record<string, CredentialInput>>["authorize"],
    }) as CredentialsConfig<Record<string, CredentialInput>>,
  ],
  callbacks: {
    async jwt({ token, user }: { token: MutableToken; user?: AdapterUser | null }) {
      if (user) {
        token.id = user.id;
        const role = extractRole(user);
        if (role) {
          token.role = role;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: MutableToken }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
        if (typeof token.role === "string") {
          session.user.role = token.role;
        } else {
          session.user.role = "USER";
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }: { user?: AdapterUser | null }) {
      if (!user?.id) return;
      await prisma.systemLog.create({
        data: { level: "INFO", message: "user.sign_in", context: { userId: user.id } },
      });
    },
  },
  trustHost: true,
};

export const protectedRoutes = ["/admin", "/compare", "/bookmarks", "/dashboard"];

function extractRole(user: AdapterUser | { role?: unknown }): string | undefined {
  if (user && typeof user === "object" && "role" in user) {
    const role = (user as { role?: unknown }).role;
    return typeof role === "string" ? role : undefined;
  }
  return undefined;
}
