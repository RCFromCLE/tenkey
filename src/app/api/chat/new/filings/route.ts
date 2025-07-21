import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '../../../../../lib/auth/config';
import { prisma } from '../../../../../lib/db';

interface Filing {
  content: string;
  form: string;
  filingDate: string;
  accessionNumber: string;
  companyName: string;
  textUrl?: string;
  symbol?: string;
  cik?: string;
  htmlUrl?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Please sign in to continue.',
        code: 'auth_required'
      }, { status: 401 });
    }

    const { filings, symbol, companyName } = await request.json();

    console.log('Creating new chat with filings:', filings?.length || 0, 'filings');

    // Create a new chat with filings but no messages yet
    const newChat = await prisma.chat.create({
      data: {
        userId: session.user.id,
        filing: {
          filings: filings.map((f: Filing) => ({
            form: f.form,
            filingDate: f.filingDate,
            accessionNumber: f.accessionNumber,
            companyName: f.companyName,
            content: f.content,
            textUrl: f.textUrl || '',
            symbol: f.symbol || '',
            cik: f.cik || '',
            htmlUrl: f.htmlUrl || ''
          }))
        },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('Successfully created new chat with filings:', newChat.id);

    return NextResponse.json({ 
      success: true,
      chatId: newChat.id,
      filingsCount: filings.length
    });

  } catch (error: any) {
    console.error('Error creating chat with filings:', error);
    return NextResponse.json(
      { error: 'Failed to create chat with filings' },
      { status: 500 }
    );
  }
}
