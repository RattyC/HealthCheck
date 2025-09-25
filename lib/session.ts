import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export function getSession() {
  return getServerSession(authConfig);
}
