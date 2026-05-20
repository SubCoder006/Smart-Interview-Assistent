"use client";

// components/Providers.tsx
// Wraps the app in all client-side providers.
// Layout stays a server component — providers live here.

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}