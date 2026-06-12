"use client";

import { SessionProvider } from "next-auth/react";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <ConfirmProvider>{children}</ConfirmProvider>
    </SessionProvider>
  );
}
