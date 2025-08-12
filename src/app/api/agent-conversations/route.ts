import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, conversationData, summaryModel } = body;

    if (action === 'save') {
      // Save conversation to database
      const { symbol, companyName, topic, messages, participants, metadata } = conversationData;

      const conversation = await prisma.agentConversation.create({
        data: {
          userEmail: session.user.email,
          symbol: symbol,
          companyName: companyName || '',
          topic: topic,
          participants: participants,
          messages: JSON.stringify(messages),
          metadata: JSON.stringify(metadata || {}),
          createdAt: new Date(),
        }
      });

      return NextResponse.json({ 
        success: true, 
        conversationId: conversation.id,
        message: 'Conversation saved successfully'
      });
    }

    if (action === 'generate-summary') {
      // Generate summary using selected model
      const { messages, symbol, companyName, topic } = conversationData;
      
      const conversationText = messages.map((msg: any) => {
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        return `[${timestamp}] ${msg.agentId}: ${msg.content}`;
      }).join('\n');

      const summaryPrompt = `Please analyze this agent conversation about ${symbol} (${companyName}) and provide a comprehensive summary.

Topic: ${topic}

Conversation:
${conversationText}

Please provide:
1. **Key Points Discussed**: Main topics and arguments presented
2. **Agent Perspectives**: Summary of each agent's viewpoint
3. **Areas of Agreement**: Points where agents agreed
4. **Areas of Disagreement**: Points of contention or differing opinions
5. **Investment Recommendation**: Overall consensus or lack thereof
6. **Risk Factors**: Key risks identified by the agents
7. **Action Items**: Any specific recommendations or next steps

Format the summary in clear, professional language suitable for investment decision-making.`;

      // Use the selected model for summary generation
      const response = await fetch(`${process.env.OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'TenKey AI - Agent Conversation Summary'
        },
        body: JSON.stringify({
          model: summaryModel || 'openai/gpt-5-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a financial analysis expert tasked with summarizing agent conversations about investment opportunities. Provide clear, actionable insights.'
            },
            {
              role: 'user',
              content: summaryPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`Summary generation failed: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content || 'Failed to generate summary';

      return NextResponse.json({ 
        success: true, 
        summary: summary,
        model: summaryModel
      });
    }

    if (action === 'list') {
      // List user's saved conversations
      const conversations = await prisma.agentConversation.findMany({
        where: {
          userEmail: session.user.email
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50, // Limit to last 50 conversations
        select: {
          id: true,
          symbol: true,
          companyName: true,
          topic: true,
          participants: true,
          createdAt: true,
          metadata: true
        }
      });

      return NextResponse.json({ 
        success: true, 
        conversations: conversations
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Agent conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('id');

    if (conversationId) {
      // Get specific conversation
      const conversation = await prisma.agentConversation.findFirst({
        where: {
          id: conversationId,
          userEmail: session.user.email
        }
      });

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        conversation: {
          ...conversation,
          messages: JSON.parse(conversation.messages),
          metadata: JSON.parse(conversation.metadata || '{}')
        }
      });
    }

    // List conversations (same as POST with action=list)
    const conversations = await prisma.agentConversation.findMany({
      where: {
        userEmail: session.user.email
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      select: {
        id: true,
        symbol: true,
        companyName: true,
        topic: true,
        participants: true,
        createdAt: true,
        metadata: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      conversations: conversations
    });

  } catch (error) {
    console.error('Agent conversation GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
