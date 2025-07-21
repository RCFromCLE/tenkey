// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authConfig } from '../../../../lib/auth/config';

// Remove the edge runtime directive to use Node.js runtime instead
const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };