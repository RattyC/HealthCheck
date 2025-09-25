import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSession } from "@/lib/session";

export async function requireUser(callbackUrl: string = "/dashboard") {
  const session = await getSession();
  if (!session?.user) {
    const target = `/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    redirect(target);
  }
  return session.user;
}

export async function requireRole(roles: Role[], fallback: string = "/dashboard") {
  const session = await getSession();
  if (!session?.user) {
    const target = `/auth/sign-in?callbackUrl=${encodeURIComponent(fallback)}`;
    redirect(target);
  }
  if (!roles.includes(session.user.role)) {
    redirect(fallback);
  }
  return session.user;
}
