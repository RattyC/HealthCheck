import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { logger } from "@/lib/logger";

export type SessionLike = {
  expires: string;
  user?: {
    id?: string;
    role?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
} | null;

export async function getSession(): Promise<SessionLike> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = (await getServerSession(authConfig as any)) ?? null;
    if (!session) return null;
    const raw = session as {
      expires?: string;
      user?: SessionLike extends { user?: infer U } ? U : never;
    };
    const normalized: SessionLike = {
      expires: raw.expires ?? new Date(0).toISOString(),
      user: (raw.user ?? undefined) as SessionLike extends { user?: infer U } ? U : never,
    };
    return normalized;
  } catch (error) {
    logger.error("session.get_failed", { error: `${error}` });
    return null;
  }
}
