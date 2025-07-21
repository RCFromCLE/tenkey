import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { ConversationEngine } from '@/lib/services/conversation-engine';
import { ConversationConfig, ModeratorFeedback, FeedbackType } from '@/lib/types/conversation-types';

// Global conversation engine instance
let conversationEngine: ConversationEngine | null = null;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { openRouterApiKey: true }
    });

    if (!user?.openRouterApiKey) {
      return NextResponse.json(
        { error: 'Please configure your OpenRouter API key in settings.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'initialize':
        return await handleInitialize(params);
      
      case 'start-conversation':
        return await handleStartConversation(params);
      
      case 'process-moderator-feedback':
        return await handleModeratorFeedback(params);
      
      case 'get-conversation-state':
        return await handleGetState();
      
      case 'stop-conversation':
        return await handleStopConversation();
      
      case 'get-analytics':
        return await handleGetAnalytics();
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Enhanced conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleInitialize(params: { config: ConversationConfig }) {
  try {
    conversationEngine = new ConversationEngine();
    await conversationEngine.initialize(params.config);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conversation engine initialized successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initialize conversation engine', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleStartConversation(params: { config: ConversationConfig }) {
  try {
    if (!conversationEngine) {
      conversationEngine = new ConversationEngine();
      await conversationEngine.initialize(params.config);
    }
    
    await conversationEngine.startConversation(params.config);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conversation started successfully',
      state: conversationEngine.getState()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start conversation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleModeratorFeedback(params: { feedback: ModeratorFeedback }) {
  try {
    if (!conversationEngine) {
      return NextResponse.json(
        { error: 'Conversation engine not initialized' },
        { status: 400 }
      );
    }
    
    await conversationEngine.processModeratorFeedback(params.feedback);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Moderator feedback processed successfully',
      state: conversationEngine.getState()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process moderator feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleGetState() {
  try {
    if (!conversationEngine) {
      return NextResponse.json(
        { error: 'Conversation engine not initialized' },
        { status: 400 }
      );
    }
    
    const state = conversationEngine.getState();
    
    return NextResponse.json({ 
      success: true, 
      state: {
        ...state,
        // Convert Maps to objects for JSON serialization
        speakingHistory: Object.fromEntries(state.speakingHistory),
        pendingResponses: Object.fromEntries(state.pendingResponses),
        agentStates: Object.fromEntries(state.agentStates)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get conversation state', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleStopConversation() {
  try {
    if (!conversationEngine) {
      return NextResponse.json(
        { error: 'Conversation engine not initialized' },
        { status: 400 }
      );
    }
    
    await conversationEngine.stopConversation();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conversation stopped successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to stop conversation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleGetAnalytics() {
  try {
    if (!conversationEngine) {
      return NextResponse.json(
        { error: 'Conversation engine not initialized' },
        { status: 400 }
      );
    }
    
    const state = conversationEngine.getState();
    
    // Extract analytics data
    const analytics = {
      conversationHealth: state.conversationHealth,
      participationStats: Object.fromEntries(state.speakingHistory),
      topicThreads: state.topicThreads,
      messageCount: state.messages.length,
      activeAgents: Array.from(state.agentStates.keys()),
      conversationDuration: state.messages.length > 0 
        ? Date.now() - state.messages[0].timestamp 
        : 0
    };
    
    return NextResponse.json({ 
      success: true, 
      analytics
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get analytics', details: error instanceof Error ? error.message : 'Unknown error' },
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
    const action = url.searchParams.get('action');

    switch (action) {
      case 'state':
        return await handleGetState();
      
      case 'analytics':
        return await handleGetAnalytics();
      
      case 'health':
        if (!conversationEngine) {
          return NextResponse.json({ 
            success: true, 
            initialized: false,
            message: 'Conversation engine not initialized'
          });
        }
        
        return NextResponse.json({ 
          success: true, 
          initialized: true,
          isActive: conversationEngine.getState().isActive
        });
      
      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Enhanced conversation GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
