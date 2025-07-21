// src/app/layout.tsx
import * as React from 'react';
import { Inter as FontSans } from "next/font/google";
import { GeistSans } from 'geist/font/sans';
import { AuthProvider } from '../lib/auth/components/providers/auth-provider';
import { ThemeProvider } from '../components/theme-provider';
import QueryProvider from '../components/providers/query-provider';
import { Navbar } from '../components/layout/navbar';
import { cn } from '../lib/utils';
import './global.css';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: 'Tenkey - Multi-Agent SEC Filing Analysis',
  description: 'AI-powered SEC filing analysis with 100+ models from OpenRouter. Chat with filings using GPT-4, Claude, Gemini, and more.',
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon/safari-pinned-tab.svg", color: "#000000" },
    ],
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable,
        GeistSans.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col bg-background">
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
              </div>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
