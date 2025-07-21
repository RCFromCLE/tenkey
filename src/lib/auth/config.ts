// src/lib/auth/config.ts
import type { AuthOptions } from 'next-auth';
import type { Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { AdapterUser } from '@auth/core/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '../db';
import AzureADProvider from 'next-auth/providers/azure-ad';

// Extend the built-in Session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

export const authConfig: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
  // Remove custom pages to use NextAuth default pages
  // This prevents redirect loops when custom pages don't exist
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Allow sign in for Azure AD provider
      if (account?.provider === 'azure-ad') {
        return true;
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // Keep other user properties
        session.user.name = session.user.name || null;
        session.user.email = session.user.email || null;
        session.user.image = session.user.image || null;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Ensure redirects stay within the same origin to prevent loops
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback to same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
};
