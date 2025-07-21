import { ConversationOrchestrator } from './conversation-orchestrator';
import { MemoryManager } from './memory-manager';
import { NaturalSpeechGenerator } from './natural-speech-generator';
import { ModeratorInterface } from './moderator-interface';
import { ConversationConfig, ConversationState, ModeratorFeedback, AgentResponse } from '../types/conversation-types';

/**
 * Core engine that manages the entire conversation flow
 * Coordinates between orchestrator, memory, speech generation, and moderator
 */
export class ConversationEngine {
  private orchestrator!: ConversationOrchestrator;
  private memoryManager!: MemoryManager;
  private speechGenerator!: NaturalSpeechGenerator;
  private moderatorInterface!: ModeratorInterface;
  private state: ConversationState;
  private isInitialized: boolean = false;

  constructor() {
    // Dependencies will be injected or created in initialize method
    this.state = this.createInitialState();
  }

  /**
   * Initialize the conversation engine with configuration
   */
  async initialize(config: ConversationConfig): Promise<void> {
    try {
      // Initialize sub-components with dependency injection
      this.orchestrator = new ConversationOrchestrator(config);
      this.memoryManager = new MemoryManager();
      this.speechGenerator = new NaturalSpeechGenerator(config.speechPatterns);
      this.moderatorInterface = new ModeratorInterface();

      // Set up inter-component communication
      this.orchestrator.setMemoryManager(this.memoryManager);
      this.orchestrator.setSpeechGenerator(this.speechGenerator);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ConversationEngine:', error);
      throw new Error('ConversationEngine initialization failed');
    }
  }

  /**
   * Start a new conversation with the given configuration
   */
  async startConversation(config: ConversationConfig): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize(config);
    }

    // Reset state for new conversation
    this.state = this.createInitialState();
    this.state.isActive = true;

    // Initialize all components for the new conversation
    await this.orchestrator.startConversation();
    await this.memoryManager.reset();
    
    // Begin orchestrated conversation flow
    this.orchestrator.on('speakerSelected', this.handleSpeakerSelection.bind(this));
    this.orchestrator.on('conversationComplete', this.handleConversationComplete.bind(this));
  }

  /**
   * Process moderator feedback and integrate it naturally into the conversation
   */
  async processModeratorFeedback(feedback: ModeratorFeedback): Promise<void> {
    if (!this.state.isActive) {
      throw new Error('No active conversation to process feedback');
    }

    // Queue the feedback for natural integration
    this.state.moderatorQueue.push({
      type: feedback.type,
      content: feedback.content,
      targetAgent: feedback.targetAgent,
      priority: feedback.priority || 'medium',
      timestamp: Date.now()
    });

    // Let the orchestrator know about the feedback
    await this.orchestrator.integrateModeratorFeedback(feedback);

    // Adjust conversation flow based on feedback type
    if (feedback.type === 'CORRECTION' || feedback.type === 'REDIRECTION') {
      // High priority - may interrupt current flow
      await this.orchestrator.requestPriorityResponse(feedback.targetAgent);
    }
  }

  /**
   * Get the current conversation state
   */
  getState(): ConversationState {
    return { ...this.state };
  }

  /**
   * Stop the current conversation
   */
  async stopConversation(): Promise<void> {
    this.state.isActive = false;
    await this.orchestrator.stopConversation();
  }

  /**
   * Handle speaker selection from orchestrator
   */
  private async handleSpeakerSelection(data: { agentId: string; priority: number }): Promise<void> {
    // Update state with current speaker
    this.state.currentSpeaker = data.agentId;
    
    // Generate response with memory context
    const memory = await this.memoryManager.getAgentMemory(data.agentId);
    const context = this.buildConversationContext();
    
    // This will be integrated with the actual agent response generation
    // For now, we're setting up the structure
  }

  /**
   * Handle conversation completion
   */
  private handleConversationComplete(): void {
    this.state.isActive = false;
    this.state.conversationMomentum = 'winding-down';
  }

  /**
   * Build current conversation context
   */
  private buildConversationContext() {
    return {
      currentTopic: this.state.currentTopic,
      recentMessages: this.state.messages.slice(-5),
      activeThreads: this.state.topicThreads.filter((t: any) => t.status === 'active'),
      speakingHistory: this.state.speakingHistory,
      momentum: this.state.conversationMomentum
    };
  }

  /**
   * Create initial conversation state
   */
  private createInitialState(): ConversationState {
    return {
      messages: [],
      isActive: false,
      currentTopic: '',
      currentSpeaker: null,
      lastSpeaker: null,
      speakingHistory: new Map(),
      pendingResponses: new Map(),
      conversationMomentum: 'building',
      conversationGraph: {
        nodes: [],
        edges: [],
        clusters: []
      },
      agentStates: new Map(),
      topicThreads: [],
      moderatorQueue: [],
      conversationHealth: {
        participationBalance: 1.0,
        topicDepth: 0,
        agreementDiversity: 0.5,
        energyLevel: 0.5,
        productivityScore: 0
      }
    };
  }
}
