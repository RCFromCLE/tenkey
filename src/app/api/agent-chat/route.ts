// src/app/api/agent-chat/route.ts
import { NextResponse } from 'next/server';
import { OpenRouterService } from '@/lib/services/openrouter';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '../../../lib/auth/config';
import { prisma } from '../../../lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Please sign in to continue.',
        code: 'auth_required'
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { openRouterApiKey: true }
    });

    if (!user?.openRouterApiKey) {
      return NextResponse.json(
        { error: 'Please configure your OpenRouter API key in settings.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { messages, model, agentId, symbol, companyName, topic } = body;

    console.log('Agent Chat API received:', {
      messagesCount: messages?.length || 0,
      model,
      agentId,
      symbol,
      topic
    });

    if (!messages?.length) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Get response from OpenRouter (non-streaming for agent conversations)
    const responseStream = await OpenRouterService.generateResponse(
      messages,
      user.openRouterApiKey,
      model || 'openai/gpt-4o-mini'
    );

    // Collect the full response
    let fullResponse = '';
    const reader = responseStream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullResponse += value;
    }

    // Clean up response to make it more conversational
    let cleanedResponse = fullResponse.trim();
    
    // Remove common formatting issues
    cleanedResponse = cleanedResponse
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
      .replace(/^[*-]\s+/gm, '') // Remove bullet points
      .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/:\s*$/, '.') // Replace trailing colons with periods
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Ensure it doesn't start with formatting
    cleanedResponse = cleanedResponse.replace(/^[:\-*#]+\s*/, '');
    
    // Ensure it ends properly
    if (cleanedResponse && !cleanedResponse.match(/[.!?]$/)) {
      cleanedResponse += '.';
    }

    // Return JSON response for agent conversations
    return NextResponse.json({
      content: cleanedResponse,
      agentId,
      symbol,
      topic,
      model
    });

  } catch (error: any) {
    console.error('Agent Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate agent response',
        details: error.message
      },
      { status: error.status || 500 }
    );
  }
}
