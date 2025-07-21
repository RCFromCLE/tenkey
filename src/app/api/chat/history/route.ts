// src/app/api/chat/history/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '../../../../lib/auth/config';
import { prisma } from '../../../../lib/db';

interface ChatResult {
  id: string;
  filing: {
    filings: Array<{
      companyName: string;
      form: string;
      filingDate: string;
      accessionNumber: string;
      textUrl?: string;
      symbol?: string;
      cik?: string;
    }>;
  };
  updatedAt: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const chats = await prisma.$queryRaw<ChatResult[]>`
      SELECT 
        id, 
        jsonb_build_object(
          'filings',
          (filing->'filings')
        ) as filing,
        "updatedAt"
      FROM "Chat"
      WHERE "userId" = ${session.user.id}
      AND filing->>'filings' IS NOT NULL
      AND filing->'filings' != '[]'::jsonb
      ORDER BY "updatedAt" DESC
      LIMIT 10
    `;

    // Format dates for JSON serialization
    const formattedChats = chats.map((chat: any) => ({
      ...chat,
      updatedAt: chat.updatedAt.toISOString()
    }));

    return NextResponse.json(formattedChats);
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    return NextResponse.json([], { status: 200 });
  }
}
