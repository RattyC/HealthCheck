"use client";

import { SessionProvider } from "next-auth/react";
import type { SessionProviderProps } from "next-auth/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { CompareProvider } from "@/components/CompareContext";

type Props = {
  children: ReactNode;
  session?: SessionProviderProps["session"];
};

export default function AppProviders({ children, session }: Props) {
  return (
    <SessionProvider session={session ?? undefined}>
      <ThemeProvider>
        <ToastProvider>
          <CompareProvider>{children}</CompareProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
