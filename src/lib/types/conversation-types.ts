/**
 * Core types and interfaces for the enhanced conversation system
 */

// Conversation configuration
export interface ConversationConfig {
  agents: AgentConfig[];
  maxRounds?: number;
  speechPatterns?: SpeechPatternConfig;
  moderatorEnabled?: boolean;
  conversationStyle?: 'formal' | 'casual' | 'debate' | 'collaborative';
}

export interface AgentConfig {
  id: string;
  name: string;
  persona: string;
  voice?: string;
  behavior?: AgentBehavior;
}

// Agent behavior traits
export interface AgentBehavior {
  interruptionFrequency: number; // 0-1
  agreementTendency: number; // 0-1
  verbosity: 'concise' | 'moderate' | 'verbose';
  thinkingPattern: 'quick' | 'deliberate' | 'analytical';
  emotionalRange: 'stoic' | 'moderate' | 'expressive';
}

// Speech patterns
export interface SpeechPatternConfig {
  enableFillers: boolean;
  enableTransitions: boolean;
  enableThinkingPauses: boolean;
  enableSelfCorrections: boolean;
}

export interface SpeechPattern {
  fillers: string[]; // "um", "well", "you know"
  transitions: string[]; // "so", "anyway", "moving on"
  acknowledgments: string[]; // "I hear you", "fair point"
  thinking: string[]; // "let me think", "hmm"
}

// Conversation state
export interface ConversationState {
  messages: ConversationMessage[];
  isActive: boolean;
  currentTopic: string;
  currentSpeaker: string | null;
  lastSpeaker: string | null;
  speakingHistory: Map<string, number>;
  pendingResponses: Map<string, ResponsePriority>;
  conversationMomentum: 'building' | 'peak' | 'winding-down';
  conversationGraph: ConversationGraph;
  agentStates: Map<string, AgentState>;
  topicThreads: TopicThread[];
  moderatorQueue: ModeratorAction[];
  conversationHealth: ConversationHealth;
}

// Message types
export interface ConversationMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: number;
  type: 'statement' | 'question' | 'response' | 'reaction' | 'interruption';
  references?: Reference[];
  emotion?: EmotionalTone;
  thread?: string;
}

export interface Reference {
  targetAgentId: string;
  targetMessageId: string;
  type: 'agreement' | 'disagreement' | 'building-on' | 'questioning';
  snippet: string;
}

export type EmotionalTone = 'neutral' | 'positive' | 'negative' | 'skeptical' | 'enthusiastic' | 'concerned';

// Agent memory
export interface AgentMemory {
  keyPoints: Map<string, Point[]>; // agentId -> their key points
  agreements: Agreement[];
  disagreements: Disagreement[];
  questions: Question[];
  insights: Insight[];
}

export interface Point {
  id: string;
  content: string;
  topic: string;
  importance: number; // 0-1
  timestamp: number;
}

export interface Agreement {
  agentId: string;
  targetAgentId: string;
  point: string;
  strength: number; // 0-1
}

export interface Disagreement {
  agentId: string;
  targetAgentId: string;
  point: string;
  reason: string;
  strength: number; // 0-1
}

export interface Question {
  id: string;
  agentId: string;
  targetAgentId?: string;
  content: string;
  answered: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface Insight {
  id: string;
  agentId: string;
  content: string;
  topic: string;
  novelty: number; // 0-1
}

// Topic threading
export interface TopicThread {
  id: string;
  mainTopic: string;
  subTopics: string[];
  participants: string[];
  depth: number;
  status: 'active' | 'resolved' | 'parked';
  startTime: number;
  lastUpdateTime: number;
}

// Moderator types
export enum FeedbackType {
  CORRECTION = 'CORRECTION',
  REDIRECTION = 'REDIRECTION',
  CLARIFICATION = 'CLARIFICATION',
  CHALLENGE = 'CHALLENGE',
  ENCOURAGEMENT = 'ENCOURAGEMENT'
}

export interface ModeratorFeedback {
  type: FeedbackType;
  content: string;
  targetAgent?: string;
  priority?: 'low' | 'medium' | 'high';
  timing?: 'immediate' | 'queued' | 'end-of-round';
}

export interface ModeratorAction {
  type: FeedbackType;
  content: string;
  targetAgent?: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface ModeratorActions {
  injectTopic: (topic: string) => void;
  requestElaboration: (agentId: string, point: string) => void;
  facilitateDebate: (agentId1: string, agentId2: string, topic: string) => void;
  summarizeThread: (threadId: string) => void;
  parkDiscussion: (reason: string) => void;
}

// Conversation health metrics
export interface ConversationHealth {
  participationBalance: number; // 0-1
  topicDepth: number; // 0-100
  agreementDiversity: number; // 0-1
  energyLevel: number; // 0-1
  productivityScore: number; // 0-100
}

// Conversation graph for visualization
export interface ConversationGraph {
  nodes: ConversationNode[];
  edges: ConversationEdge[];
  clusters: TopicCluster[];
}

export interface ConversationNode {
  id: string;
  agentId: string;
  messageId: string;
  x?: number;
  y?: number;
  size?: number;
}

export interface ConversationEdge {
  source: string;
  target: string;
  type: 'response' | 'reference' | 'agreement' | 'disagreement';
  weight: number;
}

export interface TopicCluster {
  id: string;
  topic: string;
  nodeIds: string[];
  color?: string;
}

// Agent state
export interface AgentState {
  agentId: string;
  status: 'idle' | 'thinking' | 'speaking' | 'listening';
  lastSpokeAt?: number;
  currentEmotion: EmotionalTone;
  engagementLevel: number; // 0-1
}

// Response priority
export interface ResponsePriority {
  priority: number; // 0-100
  reason: string;
  deadline?: number;
}

// Agent priority (for queue management)
export interface AgentPriority {
  agentId: string;
  priority: number;
  reason: 'relevance' | 'balance' | 'urgency' | 'moderator';
}

// Agent response
export interface AgentResponse {
  content: string;
  priority: ResponsePriority;
  references: Reference[];
  suggestedFollowUps: string[];
  emotionalTone: EmotionalTone;
  requiresResponse?: string[]; // agentIds that should respond
}

// Enhanced agent request
export interface EnhancedAgentRequest {
  agentId: string;
  conversationContext: ConversationContext;
  memory: AgentMemory;
  moderatorGuidance: ModeratorFeedback[];
  responseConstraints: ResponseConstraints;
}

export interface ConversationContext {
  currentTopic: string;
  recentMessages: ConversationMessage[];
  activeThreads: TopicThread[];
  speakingHistory: Map<string, number>;
  momentum: 'building' | 'peak' | 'winding-down';
}

export interface ResponseConstraints {
  maxLength?: number;
  mustReference?: string[];
  avoidTopics?: string[];
  emotionalTone?: EmotionalTone;
}

// Reaction tokens for natural interruptions
export interface ReactionTokens {
  agreement: string[];
  disagreement: string[];
  surprise: string[];
  thinking: string[];
  clarification: string[];
}

// Conversation templates
export type ConversationTemplate = 'debate' | 'panel' | 'workshop' | 'freeform';

export interface ConversationTemplateConfig {
  template: ConversationTemplate;
  rules?: TemplateRules;
}

export interface TemplateRules {
  turnDuration?: number;
  interruptionsAllowed?: boolean;
  moderatorIntervention?: 'minimal' | 'moderate' | 'active';
  focusTopics?: string[];
}
