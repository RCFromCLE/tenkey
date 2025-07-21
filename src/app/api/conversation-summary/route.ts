import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma as db } from '@/lib/db';

interface SummaryRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
    agentId?: string;
  }>;
  model: string;
  conversationContext: {
    symbol: string;
    companyName?: string;
    topic: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SummaryRequest = await request.json();
    const { messages, model, conversationContext } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided for summary generation' },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model not specified' },
        { status: 400 }
      );
    }

    // Get API key from database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { openRouterApiKey: true },
    });

    if (!user?.openRouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Please set your API key in settings.' },
        { status: 401 }
      );
    }

    const apiKey = user.openRouterApiKey;

    // Prepare conversation for summarization (optimized)
    const conversationText = messages
      .filter(msg => msg.content && msg.content.trim().length > 0) // Filter empty messages
      .slice(-50) // Limit to last 50 messages for performance
      .map((msg, index) => {
        const role = msg.role === 'user' ? 'User' : (msg.agentId ? `Agent (${msg.agentId})` : 'Assistant');
        // Truncate very long messages to prevent token overflow
        const content = msg.content.length > 1500 ? msg.content.substring(0, 1500) + '...' : msg.content;
        return `${role}: ${content}`;
      })
      .join('\n\n');

    // Create summary prompt
    const summaryPrompt = `You are an expert financial analyst tasked with creating a comprehensive summary of a conversation about SEC filing analysis.

**Conversation Context:**
- Company: ${conversationContext.companyName || 'Unknown'} (${conversationContext.symbol})
- Topic: ${conversationContext.topic}
- Messages: ${messages.length}

**Instructions:**
1. Provide a clear, structured summary of the key discussion points
2. Highlight important financial insights, analysis, and conclusions
3. Note any specific SEC filing references or data points discussed
4. Identify key questions asked and answers provided
5. Summarize any investment implications or recommendations
6. Use professional financial language appropriate for investment research

**IMPORTANT:** The SEC filing data discussed is real, current data from official SEC filings. Summarize the analysis normally without any disclaimers about training cutoffs or hypothetical scenarios.

**Conversation to Summarize:**
${conversationText}

**Summary Format:**
Please structure your summary with the following sections:

## Executive Summary
[Brief 2-3 sentence overview of the conversation]

## Key Discussion Points
[Main topics and themes discussed]

## Financial Insights
[Important financial data, metrics, or analysis covered]

## SEC Filing References
[Specific filing data or sections referenced]

## Investment Implications
[Any investment-related conclusions or recommendations]

## Outstanding Questions
[Any unresolved questions or areas for further analysis]

Provide a comprehensive but concise summary that captures the essence of the financial analysis discussion.`;

    // Make request to OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'TenKey AI - Conversation Summary'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content;

    if (!summary) {
      return NextResponse.json(
        { error: 'No summary generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary: summary.trim(),
      model: model,
      messageCount: messages.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
