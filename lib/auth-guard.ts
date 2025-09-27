import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/session";

type GuardUser = {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function coerceGuardUser(user: unknown): GuardUser | null {
  if (!user || typeof user !== "object") return null;
  const id = (user as { id?: unknown }).id;
  if (typeof id !== "string" || id.length === 0) return null;
  const roleValue = (user as { role?: unknown }).role;
  const role = typeof roleValue === "string" ? (roleValue as Role) : "USER";
  return {
    id,
    role,
    name: (user as { name?: string | null }).name ?? null,
    email: (user as { email?: string | null }).email ?? null,
    image: (user as { image?: string | null }).image ?? null,
  } satisfies GuardUser;
}

export async function requireUser(callbackUrl: string = "/dashboard") {
  const session = await getSession();
  const guardUser = coerceGuardUser(session?.user);
  if (!guardUser) {
    const target = `/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    redirect(target);
  }
  return guardUser;
}

export async function requireRole(roles: Role[], fallback: string = "/dashboard") {
  const session = await getSession();
  const guardUser = coerceGuardUser(session?.user);
  if (!guardUser) {
    const target = `/auth/sign-in?callbackUrl=${encodeURIComponent(fallback)}`;
    redirect(target);
  }
  if (!roles.includes(guardUser.role)) {
    redirect(fallback);
  }
  return guardUser;
}
