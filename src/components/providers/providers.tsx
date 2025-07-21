// src/components/providers/providers.tsx
'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ 
  children,
  session
}: { 
  children: React.ReactNode;
  session?: any;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
      >
        <SessionProvider 
          session={session}
          baseUrl="/api/auth"
          refetchOnWindowFocus={false}
        >
          {children}
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
