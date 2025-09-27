import NextAuth from "next-auth/next";
import { authConfig } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = NextAuth(authConfig as any);

export { handler as GET, handler as POST };
