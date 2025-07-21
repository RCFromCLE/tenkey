import { EventEmitter } from 'events';
import { OpenRouterService } from './openrouter';
import { AGENT_PERSONAS, AgentPersona } from './agent-personas';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface ConversationConfig {
  agents: string[];
  topic: string;
  symbol: string;
  companyName?: string;
  filings: any[];
  rounds: number;
  models: Record<string, string>;
  defaultModel: string;
  apiKey: string;
  speed: number;
  isMuted: boolean;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  model: string;
  round: number;
  responseTime: number;
  tokens?: number;
}

export interface ConversationState {
  isActive: boolean;
  currentRound: number;
  currentSpeaker: string | null;
  messages: AgentMessage[];
  agentContexts: Record<string, ChatCompletionMessageParam[]>;
  conversationScript: string;
  moderatorNotes: string[];
}

/**
 * Enhanced Conversation Orchestrator
 * Utilizes OpenRouter models for agent communication and script generation
 * Manages dynamic conversation flow with intelligent agent selection
 */
export class EnhancedConversationOrchestrator extends EventEmitter {
  private config: ConversationConfig;
  private state: ConversationState;
  private openRouterService: OpenRouterService;
  private conversationTimeouts: NodeJS.Timeout[] = [];

  constructor(config: ConversationConfig) {
    super();
    this.config = config;
    this.openRouterService = OpenRouterService.getInstance();
    this.state = {
      isActive: false,
      currentRound: 0,
      currentSpeaker: null,
      messages: [],
      agentContexts: {},
      conversationScript: '',
      moderatorNotes: []
    };
    this.initializeAgentContexts();
  }

  /**
   * Initialize conversation contexts for each agent
   */
  private initializeAgentContexts(): void {
    this.config.agents.forEach(agentId => {
      const persona = AGENT_PERSONAS[agentId];
      if (!persona) return;

      const filingContext = this.config.filings.length > 0 
        ? `You have access to ${this.config.filings.length} SEC filing(s) for ${this.config.symbol} (${this.config.companyName}). Use this comprehensive financial data to inform your analysis.`
        : `You are analyzing ${this.config.symbol} (${this.config.companyName}).`;

      const systemMessage: ChatCompletionMessageParam = {
        role: 'system',
        content: `${persona.systemPrompt}

CONVERSATION CONTEXT:
- You are participating in a live financial analysis discussion about ${this.config.symbol} (${this.config.companyName})
- Topic: ${this.config.topic}
- ${filingContext}
- This is a ${this.config.rounds}-round structured conversation with other expert analysts

CONVERSATION RULES:
1. LISTEN ACTIVELY: Pay attention to what other agents have said and build upon their insights
2. MAINTAIN YOUR PERSPECTIVE: Stay true to your ${persona.personality} analytical approach
3. BE CONVERSATIONAL: Use natural, engaging language as if speaking to colleagues
4. REFERENCE OTHERS: Mention specific points made by other analysts when agreeing/disagreeing
5. USE DATA: Support your arguments with specific financial metrics and filing information
6. ROUND-SPECIFIC BEHAVIOR:
   - Round 1: Comprehensive opening analysis (4-6 sentences, establish your framework)
   - Round 2+: Focused responses to colleagues (2-4 sentences, build on discussion)
7. AVOID REPETITION: Don't repeat points already well-established by others
8. BE DYNAMIC: Adapt your focus based on what aspects haven't been covered yet

Your goal is to contribute meaningfully to a collaborative analysis that helps investors understand ${this.config.symbol} from multiple expert perspectives.`
      };

      this.state.agentContexts[agentId] = [systemMessage];
    });
  }

  /**
   * Start the enhanced conversation
   */
  async startConversation(): Promise<void> {
    this.state.isActive = true;
    this.state.currentRound = 0;
    this.state.messages = [];
    this.state.conversationScript = '';
    this.state.moderatorNotes = [];

    this.emit('conversationStarted', {
      agents: this.config.agents,
      topic: this.config.topic,
      symbol: this.config.symbol
    });

    try {
      // Generate conversation script using OpenRouter
      await this.generateConversationScript();

      // Execute the conversation rounds
      for (let round = 1; round <= this.config.rounds && this.state.isActive; round++) {
        this.state.currentRound = round;
        this.emit('roundStarted', { round, totalRounds: this.config.rounds });

        await this.executeRound(round);

        // Brief pause between rounds
        if (round < this.config.rounds && this.state.isActive) {
          await this.delay(2000 / this.config.speed);
        }
      }

      // Generate final synthesis
      if (this.state.isActive) {
        await this.generateFinalSynthesis();
      }

    } catch (error) {
      console.error('Conversation error:', error);
      this.emit('conversationError', error);
    } finally {
      this.state.isActive = false;
      this.emit('conversationEnded');
    }
  }

  /**
   * Generate conversation script using OpenRouter
   */
  private async generateConversationScript(): Promise<void> {
    const scriptPrompt: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a financial discussion moderator creating a conversation script for expert analysts discussing ${this.config.symbol} (${this.config.companyName}).

PARTICIPANTS:
${this.config.agents.map(agentId => {
  const persona = AGENT_PERSONAS[agentId];
  return `- ${persona.name}: ${persona.description} (${persona.personality})`;
}).join('\n')}

Create a structured conversation outline that:
1. Identifies key discussion points for each round
2. Suggests natural conversation flow and transitions
3. Highlights potential areas of agreement/disagreement
4. Ensures each agent's expertise is utilized effectively
5. Creates opportunities for dynamic interaction

Format as a detailed outline with specific talking points and interaction cues.`
      },
      {
        role: 'user',
        content: `Create a ${this.config.rounds}-round conversation script for analyzing ${this.config.symbol} on the topic: ${this.config.topic}

Available data: ${this.config.filings.length} SEC filings
Participants: ${this.config.agents.map(id => AGENT_PERSONAS[id]?.name).join(', ')}

Focus on creating natural conversation flow where agents build upon each other's insights while maintaining their unique perspectives.`
      }
    ];

    try {
      const script = await this.openRouterService.createChatCompletion(
        scriptPrompt,
        this.config.defaultModel,
        this.config.apiKey
      );

      this.state.conversationScript = script;
      this.emit('scriptGenerated', { script });
    } catch (error) {
      console.error('Failed to generate conversation script:', error);
      // Continue without script
    }
  }

  /**
   * Execute a conversation round
   */
  private async executeRound(round: number): Promise<void> {
    // Determine speaking order for this round
    const speakingOrder = this.determineSpeakingOrder(round);

    for (let i = 0; i < speakingOrder.length && this.state.isActive; i++) {
      const agentId = speakingOrder[i];
      this.state.currentSpeaker = agentId;

      this.emit('agentThinking', { agentId, round });
      await this.delay(500 + Math.random() * 1000); // Simulate thinking
      this.emit('agentSpeaking', { agentId, round, position: i + 1, total: speakingOrder.length });

      try {
        // Generate agent response
        const response = await this.generateAgentResponse(agentId, round);
        
        if (response && this.state.isActive) {
          const message: AgentMessage = {
            id: `${agentId}-${round}-${Date.now()}`,
            agentId,
            content: response.content,
            timestamp: new Date(),
            model: response.model,
            round,
            responseTime: response.responseTime,
            tokens: response.tokens
          };

          this.state.messages.push(message);
          this.emit('messageGenerated', message);

          // Brief pause between speakers
          if (i < speakingOrder.length - 1) {
            await this.delay(1500 / this.config.speed);
          }
        }
      } catch (error) {
        console.error(`Error generating response for ${agentId}:`, error);
        this.emit('agentError', { agentId, error });
      }
    }
  }

  /**
   * Determine speaking order for a round using intelligent selection
   */
  private determineSpeakingOrder(round: number): string[] {
    if (round === 1) {
      // First round: randomize to create natural variety
      return [...this.config.agents].sort(() => Math.random() - 0.5);
    }

    // Later rounds: use intelligent ordering based on conversation flow
    return this.calculateOptimalSpeakingOrder(round);
  }

  /**
   * Calculate optimal speaking order based on conversation dynamics
   */
  private calculateOptimalSpeakingOrder(round: number): string[] {
    const agentScores = this.config.agents.map(agentId => {
      let score = 0;

      // Factor 1: Relevance to recent discussion (40%)
      score += this.calculateRelevanceScore(agentId) * 0.4;

      // Factor 2: Speaking balance (30%)
      score += this.calculateBalanceScore(agentId) * 0.3;

      // Factor 3: Potential for interesting interaction (30%)
      score += this.calculateInteractionScore(agentId) * 0.3;

      return { agentId, score };
    });

    // Sort by score and return agent IDs
    return agentScores
      .sort((a, b) => b.score - a.score)
      .map(item => item.agentId);
  }

  /**
   * Generate agent response using OpenRouter
   */
  private async generateAgentResponse(agentId: string, round: number, directQuestion?: string): Promise<{
    content: string;
    model: string;
    responseTime: number;
    tokens?: number;
  } | null> {
    const startTime = Date.now();
    const persona = AGENT_PERSONAS[agentId];
    if (!persona) return null;

    const agentModel = this.config.models[agentId] || this.config.defaultModel;

    // Build conversation context
    const conversationContext = this.buildConversationContext(agentId, round);
    
    // Create the prompt for this agent
    const prompt = this.createAgentPrompt(agentId, round, conversationContext, directQuestion);

    // Add to agent's context
    const currentContext = [...this.state.agentContexts[agentId], prompt];

    try {
      const response = await this.openRouterService.createChatCompletion(
        currentContext,
        agentModel,
        this.config.apiKey
      );

      // Update agent's context with their response
      this.state.agentContexts[agentId] = [
        ...currentContext,
        { role: 'assistant', content: response }
      ];

      const responseTime = Date.now() - startTime;

      return {
        content: this.cleanAgentResponse(response),
        model: agentModel,
        responseTime,
        tokens: response.length // Approximate token count
      };

    } catch (error) {
      console.error(`Failed to generate response for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Build conversation context for an agent
   */
  private buildConversationContext(agentId: string, round: number): string {
    const recentMessages = this.state.messages
      .filter(m => m.round >= Math.max(1, round - 1)) // Include current and previous round
      .map(m => {
        const speaker = AGENT_PERSONAS[m.agentId]?.name || 'Agent';
        return `${speaker}: ${m.content}`;
      })
      .join('\n\n');

    return recentMessages;
  }

  /**
   * Create agent prompt for current context
   */
  private createAgentPrompt(agentId: string, round: number, conversationContext: string, directQuestion?: string): ChatCompletionMessageParam {
    const persona = AGENT_PERSONAS[agentId];

    if (directQuestion) {
      return {
        role: 'user',
        content: `You have been asked a direct question: "${directQuestion}"\n\nRespond in your characteristic ${persona.personality} style, drawing upon the conversation so far if relevant.\n\nCONVERSATION SO FAR:\n${conversationContext}`
      };
    }
    
    const roundGuidance = this.getRoundGuidance(round);
    
    let prompt = `${roundGuidance}\n\n`;

    if (conversationContext) {
      prompt += `CONVERSATION SO FAR:\n${conversationContext}\n\n`;
    }

    if (round === 1) {
      prompt += `Provide your comprehensive opening analysis of ${this.config.symbol} from your ${persona.personality} perspective. Establish your analytical framework and share your key insights. (4-6 sentences)`;
    } else {
      prompt += `Respond to the discussion as a ${persona.personality} analyst. Build upon, agree with, or respectfully challenge specific points made by your colleagues. Reference their insights by name when possible. (2-4 sentences)`;
    }

    return { role: 'user', content: prompt };
  }

  /**
   * Get round-specific guidance
   */
  private getRoundGuidance(round: number): string {
    switch (round) {
      case 1:
        return "ROUND 1 - OPENING STATEMENTS: Present your comprehensive perspective and establish your analytical framework.";
      case 2:
        return "ROUND 2 - INTERACTIVE DISCUSSION: Engage with your colleagues' points. Build upon their insights or present alternative viewpoints.";
      case 3:
        return "ROUND 3 - SYNTHESIS & CONCLUSIONS: Provide your final thoughts, considering the full discussion.";
      default:
        return `ROUND ${round} - CONTINUED DISCUSSION: Continue building upon the conversation with focused insights.`;
    }
  }

  /**
   * Clean agent response for natural conversation
   */
  private cleanAgentResponse(response: string): string {
    return response
      .replace(/<thinking>[\s\S]*?<\/thinking>/g, '') // Remove thinking tags
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
      .replace(/^[*-]\s+/gm, '') // Remove bullet points
      .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/:\s*$/, '.') // Replace trailing colons with periods
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate final synthesis using OpenRouter
   */
  private async generateFinalSynthesis(): Promise<void> {
    const synthesisPrompt: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a financial discussion moderator synthesizing a comprehensive analyst discussion about ${this.config.symbol} (${this.config.companyName}).

Create a professional summary that:
1. Highlights key insights from each analytical perspective
2. Identifies areas of consensus and disagreement
3. Synthesizes the most important takeaways for investors
4. Maintains objectivity while acknowledging different viewpoints
5. Provides actionable conclusions`
      },
      {
        role: 'user',
        content: `Synthesize this ${this.config.rounds}-round analyst discussion about ${this.config.symbol}:

PARTICIPANTS:
${this.config.agents.map(agentId => `- ${AGENT_PERSONAS[agentId]?.name}: ${AGENT_PERSONAS[agentId]?.description}`).join('\n')}

FULL CONVERSATION:
${this.state.messages.map(m => {
  const speaker = AGENT_PERSONAS[m.agentId]?.name || 'Agent';
  return `${speaker} (Round ${m.round}): ${m.content}`;
}).join('\n\n')}

Provide a comprehensive synthesis that captures the key insights and helps investors understand the investment opportunity from multiple expert perspectives.`
      }
    ];

    try {
      const synthesis = await this.openRouterService.createChatCompletion(
        synthesisPrompt,
        this.config.defaultModel,
        this.config.apiKey
      );

      this.emit('synthesisGenerated', { synthesis });
    } catch (error) {
      console.error('Failed to generate synthesis:', error);
    }
  }

  /**
   * Calculate relevance score for agent selection
   */
  private calculateRelevanceScore(agentId: string): number {
    // Analyze recent messages to determine relevance
    // This is a simplified implementation
    const recentMessages = this.state.messages.slice(-3);
    const persona = AGENT_PERSONAS[agentId];
    
    if (!persona) return 0;

    let relevanceScore = 50; // Base score

    // Check if agent's focus areas are mentioned in recent discussion
    const recentText = recentMessages.map(m => m.content.toLowerCase()).join(' ');
    const focusKeywords = persona.analysisStyle.focus.concat(persona.analysisStyle.keywords);
    
    focusKeywords.forEach(keyword => {
      if (recentText.includes(keyword.toLowerCase())) {
        relevanceScore += 10;
      }
    });

    return Math.min(100, relevanceScore);
  }

  /**
   * Calculate balance score for fair participation
   */
  private calculateBalanceScore(agentId: string): number {
    const agentMessageCount = this.state.messages.filter(m => m.agentId === agentId).length;
    const totalMessages = this.state.messages.length;
    
    if (totalMessages === 0) return 100;

    const idealShare = 1 / this.config.agents.length;
    const actualShare = agentMessageCount / totalMessages;
    const balance = 1 - Math.abs(idealShare - actualShare);
    
    return balance * 100;
  }

  /**
   * Calculate interaction score for dynamic conversation
   */
  private calculateInteractionScore(agentId: string): number {
    // Simplified: agents with contrasting perspectives get higher scores
    const persona = AGENT_PERSONAS[agentId];
    if (!persona) return 0;

    // Check for potential interesting interactions based on recent speakers
    const recentSpeakers = this.state.messages.slice(-2).map(m => m.agentId);
    
    // Contrarian perspectives get bonus points
    const contrarianPairs = [
      ['bull', 'bear'],
      ['growth', 'value'],
      ['optimistic', 'skeptic']
    ];

    let interactionScore = 50;

    contrarianPairs.forEach(([type1, type2]) => {
      if (persona.personality.toLowerCase().includes(type1) || persona.personality.toLowerCase().includes(type2)) {
        if (recentSpeakers.some(speakerId => {
          const recentPersona = AGENT_PERSONAS[speakerId];
          return recentPersona && (
            recentPersona.personality.toLowerCase().includes(type1) || 
            recentPersona.personality.toLowerCase().includes(type2)
          );
        })) {
          interactionScore += 20;
        }
      }
    });

    return Math.min(100, interactionScore);
  }

  /**
   * Ask a specific agent a question
   */
  async askAgent(agentId: string, question: string): Promise<void> {
    this.emit('agentSpeaking', { agentId, round: this.state.currentRound });

    try {
      const response = await this.generateAgentResponse(agentId, this.state.currentRound, question);
      
      if (response) {
        const message: AgentMessage = {
          id: `${agentId}-question-${Date.now()}`,
          agentId,
          content: response.content,
          timestamp: new Date(),
          model: response.model,
          round: this.state.currentRound,
          responseTime: response.responseTime,
          tokens: response.tokens
        };

        this.state.messages.push(message);
        this.emit('messageGenerated', message);
      }
    } catch (error) {
      console.error(`Error asking agent ${agentId}:`, error);
      this.emit('agentError', { agentId, error });
    } finally {
      this.state.currentSpeaker = null;
    }
  }

  /**
   * Stop the conversation
   */
  stopConversation(): void {
    this.state.isActive = false;
    this.state.currentSpeaker = null;
    
    // Clear any pending timeouts
    this.conversationTimeouts.forEach(timeout => clearTimeout(timeout));
    this.conversationTimeouts = [];
    
    this.emit('conversationStopped');
  }

  /**
   * Get current conversation state
   */
  getState(): ConversationState {
    return { ...this.state };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timeout = setTimeout(resolve, ms);
      this.conversationTimeouts.push(timeout);
    });
  }
}
