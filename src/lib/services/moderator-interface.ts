import { ModeratorFeedback, ModeratorActions, FeedbackType } from '../types/conversation-types';
import { EventEmitter } from 'events';

/**
 * Interface for moderator interactions with the conversation
 * Handles feedback, corrections, and conversation control
 */
export class ModeratorInterface extends EventEmitter {
  private feedbackQueue: ModeratorFeedback[] = [];
  private isProcessing: boolean = false;

  constructor() {
    super();
  }

  /**
   * Submit feedback to the conversation
   */
  async submitFeedback(feedback: ModeratorFeedback): Promise<void> {
    // Validate feedback
    if (!feedback.content || feedback.content.trim().length === 0) {
      throw new Error('Feedback content cannot be empty');
    }

    // Add to queue with default priority if not specified
    const queuedFeedback: ModeratorFeedback = {
      ...feedback,
      priority: feedback.priority || 'medium',
      timing: feedback.timing || 'queued'
    };

    this.feedbackQueue.push(queuedFeedback);
    
    // Emit event for immediate feedback
    if (feedback.timing === 'immediate') {
      this.emit('immediateFeedback', queuedFeedback);
    }

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processFeedbackQueue();
    }
  }

  /**
   * Get moderator actions interface
   */
  getActions(): ModeratorActions {
    return {
      injectTopic: (topic: string) => {
        this.submitFeedback({
          type: FeedbackType.REDIRECTION,
          content: `Let's shift our discussion to: ${topic}`,
          timing: 'queued'
        });
      },

      requestElaboration: (agentId: string, point: string) => {
        this.submitFeedback({
          type: FeedbackType.CLARIFICATION,
          content: `Could you elaborate on: ${point}`,
          targetAgent: agentId,
          timing: 'queued'
        });
      },

      facilitateDebate: (agentId1: string, agentId2: string, topic: string) => {
        this.submitFeedback({
          type: FeedbackType.REDIRECTION,
          content: `I'd like to hear a focused debate between ${agentId1} and ${agentId2} on: ${topic}`,
          timing: 'immediate'
        });
      },

      summarizeThread: (threadId: string) => {
        this.emit('summarizeThread', threadId);
      },

      parkDiscussion: (reason: string) => {
        this.submitFeedback({
          type: FeedbackType.REDIRECTION,
          content: `Let's table this discussion for now. ${reason}`,
          timing: 'immediate',
          priority: 'high'
        });
      }
    };
  }

  /**
   * Process queued feedback
   */
  private async processFeedbackQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.feedbackQueue.length > 0) {
      const feedback = this.feedbackQueue.shift()!;
      
      // Skip immediate feedback as it's already been emitted
      if (feedback.timing === 'immediate') {
        continue;
      }

      // Emit feedback for processing
      this.emit('processFeedback', feedback);

      // Wait for natural pause in conversation
      await this.waitForNaturalPause();
    }

    this.isProcessing = false;
  }

  /**
   * Wait for a natural pause in conversation
   */
  private async waitForNaturalPause(): Promise<void> {
    // This would be connected to the conversation flow
    // For now, simulate with a timeout
    return new Promise(resolve => {
      setTimeout(resolve, 2000 + Math.random() * 3000);
    });
  }

  /**
   * Clear all pending feedback
   */
  clearFeedbackQueue(): void {
    this.feedbackQueue = [];
    this.isProcessing = false;
  }

  /**
   * Get pending feedback count
   */
  getPendingFeedbackCount(): number {
    return this.feedbackQueue.length;
  }

  /**
   * Generate correction acknowledgment template
   */
  generateCorrectionAcknowledgment(agentId: string, correction: string): string {
    const templates = [
      `Thank you for the correction. You're right about ${correction}.`,
      `I appreciate the clarification on ${correction}. Let me adjust my analysis.`,
      `Good catch. I'll incorporate that correction about ${correction}.`,
      `You're absolutely right. I need to revise my understanding of ${correction}.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate response to moderator question
   */
  generateQuestionResponse(agentId: string, question: string): string {
    // This would be enhanced with actual context
    return `Regarding your question about "${question}", let me provide my perspective...`;
  }

  /**
   * Check if feedback requires immediate attention
   */
  isHighPriority(feedback: ModeratorFeedback): boolean {
    return feedback.priority === 'high' || 
           feedback.type === FeedbackType.CORRECTION ||
           feedback.timing === 'immediate';
  }

  /**
   * Format feedback for agent consumption
   */
  formatFeedbackForAgent(feedback: ModeratorFeedback, agentId: string): string {
    const isTargeted = feedback.targetAgent === agentId;
    
    switch (feedback.type) {
      case FeedbackType.CORRECTION:
        return isTargeted 
          ? `Correction specifically for you: ${feedback.content}`
          : `General correction for all: ${feedback.content}`;
      
      case FeedbackType.REDIRECTION:
        return `New direction: ${feedback.content}`;
      
      case FeedbackType.CLARIFICATION:
        return isTargeted
          ? `Please clarify: ${feedback.content}`
          : `Clarification requested: ${feedback.content}`;
      
      case FeedbackType.CHALLENGE:
        return isTargeted
          ? `Challenge for you to address: ${feedback.content}`
          : `Challenge posed: ${feedback.content}`;
      
      case FeedbackType.ENCOURAGEMENT:
        return isTargeted
          ? `Encouragement for you: ${feedback.content}`
          : `General encouragement: ${feedback.content}`;
      
      default:
        return feedback.content;
    }
  }

  /**
   * Track feedback effectiveness
   */
  trackFeedbackEffectiveness(feedbackId: string, wasIncorporated: boolean): void {
    // This would track how well agents respond to different types of feedback
    this.emit('feedbackTracking', {
      feedbackId,
      wasIncorporated,
      timestamp: Date.now()
    });
  }
}
