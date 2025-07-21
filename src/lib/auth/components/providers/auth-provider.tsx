// src/lib/auth/components/providers/auth-provider.tsx
'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { type Session } from 'next-auth';
import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: Props) {
  return (
    <SessionProvider 
      session={session}
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
