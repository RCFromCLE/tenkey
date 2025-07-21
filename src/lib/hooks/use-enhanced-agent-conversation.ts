import { useState, useCallback, useRef, useEffect } from 'react';
import { EnhancedConversationOrchestrator, ConversationConfig, AgentMessage, ConversationState } from '@/lib/services/enhanced-conversation-orchestrator';
import { useTextToSpeechOpenAI } from './use-text-to-speech-openai';
import { AGENT_PERSONAS } from '@/lib/services/agent-personas';

interface ConversationMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  voiceId?: string;
  model?: string;
  round?: number;
  responseTime?: number;
}

interface UseEnhancedAgentConversationState {
  messages: ConversationMessage[];
  conversationState: {
    isActive: boolean;
    currentSpeaker: string | null;
    round: number;
    consensus: string | null;
    topic: string;
    speed: number;
  };
  typingAgents: Set<string>;
  thinkingAgents: Set<string>;
  currentlyPlaying: string | null;
  conversationScript: string;
  moderatorNotes: string[];
  isGeneratingScript: boolean;
  orchestrator: EnhancedConversationOrchestrator | null;
}

const CONVERSATION_TOPICS = [
  'Financial Analysis',
  'Investment Thesis',
  'Risk Assessment',
  'Growth Prospects',
  'Valuation Analysis'
];

// OpenAI voice mapping for agents
const AGENT_VOICE_MAPPING: Record<string, string> = {
  bull: 'coral',      // Bright, energetic for optimistic analysis
  bear: 'onyx',       // Strong, commanding for cautious analysis
  skeptic: 'echo',    // Deep, resonant for questioning tone
  balanced: 'alloy',  // Neutral, balanced for objective analysis
  technical: 'sage',  // Calm, knowledgeable for data-driven analysis
  macro: 'fable',     // Wise, thoughtful for strategic thinking
  risk: 'ash',        // Warm but serious for risk assessment
  growth: 'nova',     // Dynamic, modern for growth opportunities
  value: 'shimmer',   // Gentle, soothing for patient value investing
  contrarian: 'ballad', // Smooth, storytelling for contrarian views
  moderator: 'alloy'  // Neutral for moderator
};

export function useEnhancedAgentConversation() {
  const [state, setState] = useState<UseEnhancedAgentConversationState>({
    messages: [],
    conversationState: {
      isActive: false,
      currentSpeaker: null,
      round: 0,
      consensus: null,
      topic: CONVERSATION_TOPICS[0],
      speed: 1.0
    },
    typingAgents: new Set(),
    thinkingAgents: new Set(),
    currentlyPlaying: null,
    conversationScript: '',
    moderatorNotes: [],
    isGeneratingScript: false,
    orchestrator: null
  });

  const tts = useTextToSpeechOpenAI();
  const orchestratorRef = useRef<EnhancedConversationOrchestrator | null>(null);
  const audioQueueRef = useRef<Array<{ messageId: string; text: string; agentId: string; speed: number }>>([]);
  const isProcessingAudioRef = useRef(false);

  // Process audio queue sequentially
  const processAudioQueue = useCallback(async () => {
    if (isProcessingAudioRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isProcessingAudioRef.current = true;
    const audioItem = audioQueueRef.current.shift();

    if (audioItem) {
      const { messageId, text, agentId, speed } = audioItem;

      try {
        setState(prev => ({ ...prev, currentlyPlaying: messageId }));
        const voiceId = AGENT_VOICE_MAPPING[agentId] || 'alloy';
        await tts.speak(
          text.replace(/\*\*/g, '').replace(/\*/g, ''),
          {
            voice: voiceId as 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer',
            model: 'tts-1'
          },
          speed
        );
      } catch (error) {
        console.error('TTS Error:', error);
      } finally {
        setState(prev => ({ ...prev, currentlyPlaying: null }));
        isProcessingAudioRef.current = false;
        processAudioQueue(); // Process next item in the queue
      }
    } else {
      isProcessingAudioRef.current = false;
    }
  }, [tts]);

  // Add message to conversation
  const addMessage = useCallback((
    agentId: string, 
    content: string, 
    model?: string, 
    round?: number,
    responseTime?: number,
    isMuted: boolean = false
  ) => {
    const messageId = `${agentId}-${round || 0}-${Date.now()}`;
    
    const newMessage: ConversationMessage = {
      id: messageId,
      agentId,
      content,
      timestamp: new Date(),
      voiceId: AGENT_VOICE_MAPPING[agentId],
      model,
      round,
      responseTime
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    // Queue for TTS if not muted
    if (!isMuted) {
      audioQueueRef.current.push({
        messageId,
        text: content,
        agentId,
        speed: state.conversationState.speed
      });
      processAudioQueue();
    }

    return messageId;
  }, [state.conversationState.speed, processAudioQueue]);

  // Start enhanced conversation
  const startConversation = useCallback(async (
    selectedAgents: string[],
    symbol: string,
    companyName: string | undefined,
    selectedModel: string,
    agentModels: Record<string, string>,
    filings: any[],
    apiKey: string,
    isMuted: boolean = false,
    rounds: number = 3
  ) => {
    // Validate inputs
    if (selectedAgents.length < 2) {
      alert('Please select at least 2 agents for a conversation');
      return;
    }

    if (selectedAgents.length > 5) {
      selectedAgents = selectedAgents.slice(0, 5);
    }

    // Stop any existing conversation
    if (orchestratorRef.current) {
      orchestratorRef.current.stopConversation();
    }

    // Clear previous state
    setState(prev => ({
      ...prev,
      messages: [],
      conversationState: {
        ...prev.conversationState,
        isActive: true,
        currentSpeaker: null,
        round: 0,
        consensus: null
      },
      typingAgents: new Set(),
      currentlyPlaying: null,
      conversationScript: '',
      moderatorNotes: [],
      isGeneratingScript: true
    }));

    // Clear audio queue
    audioQueueRef.current = [];
    tts.stop();

    try {
      // Create conversation configuration
      const config: ConversationConfig = {
        agents: selectedAgents,
        topic: state.conversationState.topic,
        symbol,
        companyName,
        filings,
        rounds,
        models: agentModels,
        defaultModel: selectedModel,
        apiKey,
        speed: state.conversationState.speed,
        isMuted
      };

      // Create new orchestrator
      const orchestrator = new EnhancedConversationOrchestrator(config);
      orchestratorRef.current = orchestrator;

      // Set up event listeners
      orchestrator.on('conversationStarted', (data) => {
        console.log('Conversation started:', data);
        setState(prev => ({ ...prev, isGeneratingScript: false }));
        
        // Add opening message
        const agentNames = selectedAgents.map(id => AGENT_PERSONAS[id]?.name).join(', ');
        const openingMessage = `🎯 **Enhanced ${config.topic} Discussion: ${symbol}**

Welcome to TenKey AI's expert analyst roundtable! Today we're conducting an in-depth analysis of ${companyName || symbol} with our distinguished panel.

**Expert Panel:**
${selectedAgents.map(id => {
  const agent = AGENT_PERSONAS[id];
  const icons = { bull: '🐂', bear: '🐻', balanced: '⚖️', skeptic: '🤔', technical: '📊', macro: '🌍', risk: '🛡️', growth: '🚀', value: '💎', contrarian: '🔄' };
  return `• ${icons[id as keyof typeof icons] || '🤖'} **${agent?.name}** - ${agent?.description}`;
}).join('\n')}

**Discussion Structure:**
This ${rounds}-round discussion will feature dynamic agent interaction powered by OpenRouter models, with each analyst contributing their unique perspective based on ${filings.length} SEC filing${filings.length !== 1 ? 's' : ''}.

---

Let's begin our comprehensive analysis!`;

        addMessage('moderator', openingMessage, undefined, 0, undefined, isMuted);
      });

      orchestrator.on('scriptGenerated', (data) => {
        setState(prev => ({
          ...prev,
          conversationScript: data.script,
          isGeneratingScript: false
        }));
      });

      orchestrator.on('roundStarted', (data) => {
        setState(prev => ({
          ...prev,
          conversationState: {
            ...prev.conversationState,
            round: data.round
          }
        }));

        if (data.round > 1) {
          const roundMessage = `🔄 **Round ${data.round}/${data.totalRounds}**

${data.round === 2 ? 'Interactive discussion phase - agents will now respond to each other\'s insights.' : 
  data.round === 3 ? 'Final synthesis - concluding thoughts and investment implications.' : 
  'Continuing the discussion with deeper analysis.'}`;

          addMessage('moderator', roundMessage, undefined, data.round, undefined, isMuted);
        }
      });

      orchestrator.on('agentThinking', (data) => {
        setState(prev => {
          const newThinking = new Set(prev.thinkingAgents);
          newThinking.add(data.agentId);
          return { ...prev, thinkingAgents: newThinking };
        });
      });

      orchestrator.on('agentSpeaking', (data) => {
        setState(prev => {
          const newThinking = new Set(prev.thinkingAgents);
          newThinking.delete(data.agentId);
          const newTyping = new Set(prev.typingAgents);
          newTyping.add(data.agentId);
          return { 
            ...prev, 
            thinkingAgents: newThinking,
            typingAgents: newTyping,
            conversationState: {
              ...prev.conversationState,
              currentSpeaker: data.agentId
            }
          };
        });
      });

      orchestrator.on('messageGenerated', (message: AgentMessage) => {
        // Remove from typing
        setState(prev => {
          const newTyping = new Set(prev.typingAgents);
          newTyping.delete(message.agentId);
          return { ...prev, typingAgents: newTyping };
        });

        // Add message to conversation
        addMessage(
          message.agentId,
          message.content,
          message.model,
          message.round,
          message.responseTime,
          isMuted
        );
      });

      orchestrator.on('synthesisGenerated', (data) => {
        addMessage('moderator', `🤝 **Discussion Synthesis**\n\n${data.synthesis}`, undefined, rounds + 1, undefined, isMuted);
        
        setState(prev => ({
          ...prev,
          conversationState: {
            ...prev.conversationState,
            consensus: 'Generated',
            isActive: false,
            currentSpeaker: null
          }
        }));
      });

      orchestrator.on('conversationEnded', () => {
        setState(prev => ({
          ...prev,
          conversationState: {
            ...prev.conversationState,
            isActive: false,
            currentSpeaker: null
          }
        }));
      });

      orchestrator.on('conversationError', (error) => {
        console.error('Conversation error:', error);
        addMessage('moderator', '⚠️ **Discussion Error**\n\nThere was an issue with the conversation. Please try again.', undefined, undefined, undefined, isMuted);
        
        setState(prev => ({
          ...prev,
          conversationState: {
            ...prev.conversationState,
            isActive: false,
            currentSpeaker: null
          }
        }));
      });

      // Store orchestrator reference
      setState(prev => ({ ...prev, orchestrator }));

      // Start the conversation
      await orchestrator.startConversation();

    } catch (error) {
      console.error('Failed to start conversation:', error);
      setState(prev => ({
        ...prev,
        conversationState: {
          ...prev.conversationState,
          isActive: false
        },
        isGeneratingScript: false
      }));
    }
  }, [state.conversationState.topic, state.conversationState.speed, addMessage, tts]);

  // Stop conversation
  const stopConversation = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.stopConversation();
    }

    // Clear audio queue and stop TTS
    audioQueueRef.current = [];
    tts.stop();

    setState(prev => ({
      ...prev,
      conversationState: {
        ...prev.conversationState,
        isActive: false,
        currentSpeaker: null
      },
      currentlyPlaying: null,
      typingAgents: new Set()
    }));

    // Add stop message
    const stopMessage: ConversationMessage = {
      id: `moderator-stop-${Date.now()}`,
      agentId: 'moderator',
      content: '⏹️ **Discussion Stopped**\n\nThe conversation has been stopped by user request.',
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, stopMessage]
    }));
  }, [tts]);

  // Reset conversation
  const resetConversation = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.stopConversation();
      orchestratorRef.current = null;
    }

    audioQueueRef.current = [];
    tts.stop();

    setState({
      messages: [],
      conversationState: {
        isActive: false,
        currentSpeaker: null,
        round: 0,
        consensus: null,
        topic: state.conversationState.topic,
        speed: state.conversationState.speed
      },
      typingAgents: new Set(),
      thinkingAgents: new Set(),
      currentlyPlaying: null,
      conversationScript: '',
      moderatorNotes: [],
      isGeneratingScript: false,
      orchestrator: null
    });
  }, [tts, state.conversationState.topic, state.conversationState.speed]);

  // Update conversation settings
  const updateConversationState = useCallback((updates: Partial<typeof state.conversationState>) => {
    setState(prev => ({
      ...prev,
      conversationState: {
        ...prev.conversationState,
        ...updates
      }
    }));
  }, []);

  // Stop all audio
  const stopAllAudio = useCallback(() => {
    audioQueueRef.current = [];
    tts.stop();
    setState(prev => ({ ...prev, currentlyPlaying: null }));
  }, [tts]);

  // Ask specific agent a question
  const askAgent = useCallback(async (
    agentId: string,
    question: string,
    isMuted: boolean = false
  ) => {
    if (!orchestratorRef.current) {
      console.error("Orchestrator not initialized. Cannot ask agent.");
      addMessage('moderator', 'Please start a conversation before asking direct questions.', undefined, undefined, undefined, isMuted);
      return;
    }

    // Add moderator question
    addMessage('moderator', `**Question for ${AGENT_PERSONAS[agentId]?.name}**: ${question}`, undefined, undefined, undefined, isMuted);

    // Use the orchestrator to ask the agent
    await orchestratorRef.current.askAgent(agentId, question);

  }, [addMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (orchestratorRef.current) {
        orchestratorRef.current.stopConversation();
      }
      audioQueueRef.current = [];
      tts.stop();
    };
  }, [tts]);

  return {
    // State
    messages: state.messages,
    conversationState: state.conversationState,
    typingAgents: state.typingAgents,
    thinkingAgents: state.thinkingAgents,
    currentlyPlaying: state.currentlyPlaying,
    conversationScript: state.conversationScript,
    moderatorNotes: state.moderatorNotes,
    isGeneratingScript: state.isGeneratingScript,
    textSyncState: { currentCharIndex: tts.currentCharIndex, totalChars: tts.totalChars },
    
    // Actions
    startConversation,
    stopConversation,
    resetConversation,
    updateConversationState,
    stopAllAudio,
    askAgent,
    
    // Constants
    CONVERSATION_TOPICS,
    AGENT_VOICE_MAPPING
  };
}
