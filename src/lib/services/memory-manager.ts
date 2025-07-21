import { AgentMemory, Point, Agreement, Disagreement, Question, Insight } from '../types/conversation-types';

/**
 * Manages conversation memory for all agents
 * Tracks key points, agreements, disagreements, questions, and insights
 */
export class MemoryManager {
  private agentMemories: Map<string, AgentMemory> = new Map();

  constructor() {
    // Initialize memory storage
  }

  /**
   * Get memory for a specific agent
   */
  async getAgentMemory(agentId: string): Promise<AgentMemory> {
    if (!this.agentMemories.has(agentId)) {
      this.initializeAgentMemory(agentId);
    }
    return this.agentMemories.get(agentId)!;
  }

  /**
   * Add a key point to an agent's memory
   */
  async addKeyPoint(agentId: string, point: Point): Promise<void> {
    const memory = await this.getAgentMemory(agentId);
    const agentPoints = memory.keyPoints.get(agentId) || [];
    agentPoints.push(point);
    memory.keyPoints.set(agentId, agentPoints);
  }

  /**
   * Record an agreement between agents
   */
  async recordAgreement(agreement: Agreement): Promise<void> {
    const memory = await this.getAgentMemory(agreement.agentId);
    memory.agreements.push(agreement);
  }

  /**
   * Record a disagreement between agents
   */
  async recordDisagreement(disagreement: Disagreement): Promise<void> {
    const memory = await this.getAgentMemory(disagreement.agentId);
    memory.disagreements.push(disagreement);
  }

  /**
   * Add a question to memory
   */
  async addQuestion(question: Question): Promise<void> {
    const memory = await this.getAgentMemory(question.agentId);
    memory.questions.push(question);
  }

  /**
   * Add an insight to memory
   */
  async addInsight(insight: Insight): Promise<void> {
    const memory = await this.getAgentMemory(insight.agentId);
    memory.insights.push(insight);
  }

  /**
   * Reset all memories
   */
  async reset(): Promise<void> {
    this.agentMemories.clear();
  }

  /**
   * Initialize memory for an agent
   */
  private initializeAgentMemory(agentId: string): void {
    this.agentMemories.set(agentId, {
      keyPoints: new Map(),
      agreements: [],
      disagreements: [],
      questions: [],
      insights: []
    });
  }

  /**
   * Extract key points from a message
   * TODO: Implement NLP-based extraction
   */
  async extractKeyPoints(agentId: string, message: string): Promise<Point[]> {
    // Placeholder implementation
    // In the future, this will use NLP to extract key points
    const point: Point = {
      id: `${agentId}-${Date.now()}`,
      content: message.substring(0, 100), // Take first 100 chars as placeholder
      topic: 'general',
      importance: 0.5,
      timestamp: Date.now()
    };
    
    await this.addKeyPoint(agentId, point);
    return [point];
  }

  /**
   * Find related points across all agents
   */
  async findRelatedPoints(topic: string, excludeAgentId?: string): Promise<Point[]> {
    const relatedPoints: Point[] = [];
    
    for (const [agentId, memory] of Array.from(this.agentMemories.entries())) {
      if (agentId === excludeAgentId) continue;
      
      const agentPoints = memory.keyPoints.get(agentId) || [];
      const topicPoints = agentPoints.filter((point: Point) => 
        point.topic.toLowerCase().includes(topic.toLowerCase()) ||
        point.content.toLowerCase().includes(topic.toLowerCase())
      );
      
      relatedPoints.push(...topicPoints);
    }
    
    return relatedPoints.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Get conversation summary
   */
  async getConversationSummary(): Promise<{
    totalPoints: number;
    totalAgreements: number;
    totalDisagreements: number;
    unansweredQuestions: number;
    keyInsights: Insight[];
  }> {
    let totalPoints = 0;
    let totalAgreements = 0;
    let totalDisagreements = 0;
    let unansweredQuestions = 0;
    const allInsights: Insight[] = [];

    for (const memory of Array.from(this.agentMemories.values())) {
      for (const points of Array.from(memory.keyPoints.values())) {
        totalPoints += points.length;
      }
      totalAgreements += memory.agreements.length;
      totalDisagreements += memory.disagreements.length;
      unansweredQuestions += memory.questions.filter((q: Question) => !q.answered).length;
      allInsights.push(...memory.insights);
    }

    // Sort insights by novelty
    const keyInsights = allInsights
      .sort((a, b) => b.novelty - a.novelty)
      .slice(0, 5);

    return {
      totalPoints,
      totalAgreements,
      totalDisagreements,
      unansweredQuestions,
      keyInsights
    };
  }
}
