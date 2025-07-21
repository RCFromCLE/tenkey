import { EventEmitter } from 'events';
import { ConversationConfig, AgentPriority, ModeratorFeedback } from '../types/conversation-types';
import { MemoryManager } from './memory-manager';
import { NaturalSpeechGenerator } from './natural-speech-generator';

interface SpeakerQueueItem {
  agentId: string;
  priority: number;
  reason: 'response' | 'follow-up' | 'interruption' | 'moderator-directed';
  timestamp: number;
}

/**
 * Manages the speaking order and conversation flow
 * Implements dynamic turn management based on relevance and participation
 */
export class ConversationOrchestrator extends EventEmitter {
  private config: ConversationConfig;
  private speakerQueue: SpeakerQueueItem[] = [];
  private speakingHistory: Map<string, number> = new Map();
  private currentSpeaker: string | null = null;
  private memoryManager?: MemoryManager;
  private speechGenerator?: NaturalSpeechGenerator;
  private isActive: boolean = false;

  constructor(config: ConversationConfig) {
    super();
    this.config = config;
    this.initializeSpeakingHistory();
  }

  /**
   * Set the memory manager for context-aware decisions
   */
  setMemoryManager(memoryManager: MemoryManager): void {
    this.memoryManager = memoryManager;
  }

  /**
   * Set the speech generator for natural transitions
   */
  setSpeechGenerator(speechGenerator: NaturalSpeechGenerator): void {
    this.speechGenerator = speechGenerator;
  }

  /**
   * Start the conversation orchestration
   */
  async startConversation(): Promise<void> {
    this.isActive = true;
    this.speakerQueue = [];
    this.currentSpeaker = null;
    this.initializeSpeakingHistory();

    // Start with a random agent or the designated starter
    const startingAgent = this.selectStartingAgent();
    this.queueSpeaker(startingAgent, 100, 'response');
    
    // Begin processing the queue
    this.processQueue();
  }

  /**
   * Stop the conversation orchestration
   */
  async stopConversation(): Promise<void> {
    this.isActive = false;
    this.speakerQueue = [];
    this.currentSpeaker = null;
  }

  /**
   * Queue a speaker with priority
   */
  queueSpeaker(agentId: string, priority: number, reason: SpeakerQueueItem['reason']): void {
    const queueItem: SpeakerQueueItem = {
      agentId,
      priority,
      reason,
      timestamp: Date.now()
    };

    // Insert into queue maintaining priority order
    const insertIndex = this.speakerQueue.findIndex(item => item.priority < priority);
    if (insertIndex === -1) {
      this.speakerQueue.push(queueItem);
    } else {
      this.speakerQueue.splice(insertIndex, 0, queueItem);
    }
  }

  /**
   * Calculate speaking priority based on multiple factors
   */
  calculatePriority(agentId: string, context: any): number {
    let priority = 50; // Base priority

    // Factor 1: Relevance to current topic (0-40 points)
    const relevanceScore = this.calculateRelevanceScore(agentId, context);
    priority += relevanceScore * 0.4;

    // Factor 2: Speaking history balance (0-30 points)
    const balanceScore = this.calculateBalanceScore(agentId);
    priority += balanceScore * 0.3;

    // Factor 3: Response urgency (0-30 points)
    const urgencyScore = this.calculateUrgencyScore(agentId, context);
    priority += urgencyScore * 0.3;

    return Math.min(100, Math.max(0, priority));
  }

  /**
   * Integrate moderator feedback into the conversation flow
   */
  async integrateModeratorFeedback(feedback: ModeratorFeedback): Promise<void> {
    // Adjust priorities based on feedback type
    switch (feedback.type) {
      case 'CORRECTION':
      case 'REDIRECTION':
        // High priority for targeted agent
        if (feedback.targetAgent) {
          this.queueSpeaker(feedback.targetAgent, 90, 'moderator-directed');
        }
        break;
      case 'CLARIFICATION':
        // Medium priority for clarification
        if (feedback.targetAgent) {
          this.queueSpeaker(feedback.targetAgent, 70, 'moderator-directed');
        }
        break;
      case 'ENCOURAGEMENT':
        // Lower priority, natural flow
        if (feedback.targetAgent) {
          this.queueSpeaker(feedback.targetAgent, 50, 'moderator-directed');
        }
        break;
    }
  }

  /**
   * Request a priority response from a specific agent
   */
  async requestPriorityResponse(agentId: string): Promise<void> {
    // Clear lower priority items for this agent
    this.speakerQueue = this.speakerQueue.filter(
      item => !(item.agentId === agentId && item.priority < 80)
    );
    
    // Queue with high priority
    this.queueSpeaker(agentId, 95, 'moderator-directed');
  }

  /**
   * Process the speaker queue
   */
  private async processQueue(): Promise<void> {
    while (this.isActive) {
      if (this.speakerQueue.length === 0) {
        // No speakers in queue, determine next speaker dynamically
        await this.determineNextSpeaker();
      }

      const nextSpeaker = this.speakerQueue.shift();
      if (nextSpeaker) {
        this.currentSpeaker = nextSpeaker.agentId;
        this.updateSpeakingHistory(nextSpeaker.agentId);
        
        // Emit speaker selection event
        this.emit('speakerSelected', {
          agentId: nextSpeaker.agentId,
          priority: nextSpeaker.priority,
          reason: nextSpeaker.reason
        });

        // Wait for response completion (this will be handled by the engine)
        await this.waitForSpeakerCompletion();
      }

      // Small delay between speakers for natural flow
      await this.delay(500 + Math.random() * 1000);
    }
  }

  /**
   * Determine the next speaker dynamically
   */
  private async determineNextSpeaker(): Promise<void> {
    // Get current conversation context
    const context = await this.getCurrentContext();
    
    // Calculate priorities for all agents
    const agentPriorities = this.config.agents.map((agent: any) => ({
      agentId: agent.id,
      priority: this.calculatePriority(agent.id, context)
    }));

    // Sort by priority and select top candidate
    agentPriorities.sort((a: any, b: any) => b.priority - a.priority);
    
    if (agentPriorities.length > 0 && agentPriorities[0].priority > 30) {
      this.queueSpeaker(
        agentPriorities[0].agentId,
        agentPriorities[0].priority,
        'response'
      );
    } else {
      // Conversation might be winding down
      this.emit('conversationComplete');
    }
  }

  /**
   * Calculate relevance score for an agent
   */
  private calculateRelevanceScore(agentId: string, context: any): number {
    // This will be enhanced with actual NLP analysis
    // For now, return a random score for demonstration
    return Math.random() * 100;
  }

  /**
   * Calculate balance score to ensure fair participation
   */
  private calculateBalanceScore(agentId: string): number {
    const totalSpeakers = this.config.agents.length;
    const agentCount = this.speakingHistory.get(agentId) || 0;
    const totalCount = Array.from(this.speakingHistory.values()).reduce((a, b) => a + b, 0);
    
    if (totalCount === 0) return 100;
    
    const idealShare = 1 / totalSpeakers;
    const actualShare = agentCount / totalCount;
    const balance = 1 - Math.abs(idealShare - actualShare);
    
    return balance * 100;
  }

  /**
   * Calculate urgency score based on context
   */
  private calculateUrgencyScore(agentId: string, context: any): number {
    // Check if agent was directly addressed or challenged
    // For now, return a moderate score
    return 50;
  }

  /**
   * Initialize speaking history for all agents
   */
  private initializeSpeakingHistory(): void {
    this.speakingHistory.clear();
    this.config.agents.forEach((agent: any) => {
      this.speakingHistory.set(agent.id, 0);
    });
  }

  /**
   * Update speaking history
   */
  private updateSpeakingHistory(agentId: string): void {
    const current = this.speakingHistory.get(agentId) || 0;
    this.speakingHistory.set(agentId, current + 1);
  }

  /**
   * Select the starting agent
   */
  private selectStartingAgent(): string {
    // Could be configured or random
    const agents = this.config.agents;
    return agents[Math.floor(Math.random() * agents.length)].id;
  }

  /**
   * Get current conversation context
   */
  private async getCurrentContext(): Promise<any> {
    // This will be enhanced to get actual context from memory manager
    return {
      currentTopic: '',
      recentSpeakers: Array.from(this.speakingHistory.keys()).slice(-3),
      momentum: 'building'
    };
  }

  /**
   * Wait for the current speaker to complete
   */
  private async waitForSpeakerCompletion(): Promise<void> {
    // This will be replaced with actual completion detection
    // For now, simulate with a timeout
    await this.delay(3000 + Math.random() * 2000);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
