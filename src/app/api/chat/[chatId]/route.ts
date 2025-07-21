import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '../../../../lib/auth/config';
import { prisma } from '../../../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Please sign in to continue.',
        code: 'auth_required'
      }, { status: 401 });
    }

    const { chatId } = await params;

    // Fetch the chat with all its data
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id
      }
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 404 }
      );
    }

    // Type the filing data properly
    const filingData = chat.filing as any;
    const filingsCount = filingData?.filings?.length || 0;
    
    console.log('Retrieved chat:', chatId, 'with', chat.messages?.length || 0, 'messages and', filingsCount, 'filings');

    return NextResponse.json({
      id: chat.id,
      messages: chat.messages || [],
      filing: filingData || { filings: [] },
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    });

  } catch (error: any) {
    console.error('Error retrieving chat:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat' },
      { status: 500 }
    );
  }
}
