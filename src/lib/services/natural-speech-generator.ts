import { SpeechPatternConfig, SpeechPattern, AgentBehavior } from '../types/conversation-types';

/**
 * Generates natural speech patterns for agents
 * Adds fillers, transitions, pauses, and conversational elements
 */
export class NaturalSpeechGenerator {
  private config: SpeechPatternConfig;
  private agentPatterns: Map<string, SpeechPattern> = new Map();

  constructor(config?: SpeechPatternConfig) {
    this.config = config || {
      enableFillers: true,
      enableTransitions: true,
      enableThinkingPauses: true,
      enableSelfCorrections: true
    };
    
    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default speech patterns for different agent types
   */
  private initializeDefaultPatterns(): void {
    // Bull agent - enthusiastic, confident
    this.agentPatterns.set('bull', {
      fillers: ['you know', 'I mean', 'basically'],
      transitions: ['and here\'s the thing', 'what\'s exciting is', 'the opportunity here is'],
      acknowledgments: ['absolutely', 'exactly right', 'I completely agree'],
      thinking: ['let me see', 'if I think about it', 'looking at this']
    });

    // Bear agent - cautious, analytical
    this.agentPatterns.set('bear', {
      fillers: ['well', 'however', 'that said'],
      transitions: ['but consider this', 'on the other hand', 'we need to remember'],
      acknowledgments: ['I see your point', 'that\'s fair', 'I understand'],
      thinking: ['hmm', 'let me think', 'if we analyze this']
    });

    // Skeptic agent - questioning, probing
    this.agentPatterns.set('skeptic', {
      fillers: ['actually', 'wait', 'hold on'],
      transitions: ['but what about', 'have we considered', 'I\'m wondering'],
      acknowledgments: ['interesting point', 'I hear you', 'okay, but'],
      thinking: ['let me question this', 'I\'m not sure', 'this makes me wonder']
    });

    // Balanced agent - measured, diplomatic
    this.agentPatterns.set('balanced', {
      fillers: ['certainly', 'indeed', 'of course'],
      transitions: ['furthermore', 'additionally', 'it\'s worth noting'],
      acknowledgments: ['that\'s a valid point', 'I appreciate that', 'fair enough'],
      thinking: ['let\'s consider', 'if we look at both sides', 'thinking about this']
    });

    // Technical agent - data-driven, precise
    this.agentPatterns.set('technical', {
      fillers: ['specifically', 'technically', 'precisely'],
      transitions: ['the data shows', 'according to the metrics', 'if we examine'],
      acknowledgments: ['correct', 'accurate', 'that aligns with the data'],
      thinking: ['calculating', 'analyzing', 'let me check the numbers']
    });

    // Default pattern for other agents
    const defaultPattern: SpeechPattern = {
      fillers: ['um', 'well', 'you know'],
      transitions: ['so', 'anyway', 'moving on'],
      acknowledgments: ['I see', 'right', 'understood'],
      thinking: ['hmm', 'let me think', 'well']
    };

    // Set default for remaining agents
    ['macro', 'risk', 'growth', 'value', 'contrarian'].forEach(agentId => {
      if (!this.agentPatterns.has(agentId)) {
        this.agentPatterns.set(agentId, { ...defaultPattern });
      }
    });
  }

  /**
   * Add natural speech elements to a message
   */
  enhanceMessage(
    message: string, 
    agentId: string, 
    behavior?: AgentBehavior,
    context?: { isOpening?: boolean; isResponse?: boolean; isConclusion?: boolean }
  ): string {
    let enhanced = message;
    const pattern = this.agentPatterns.get(agentId) || this.agentPatterns.get('default')!;

    // Add opening filler if appropriate
    if (context?.isOpening && this.config.enableFillers) {
      const filler = this.selectRandom(pattern.fillers);
      enhanced = `${this.capitalize(filler)}, ${enhanced}`;
    }

    // Add transitions for responses
    if (context?.isResponse && this.config.enableTransitions) {
      const transition = this.selectRandom(pattern.transitions);
      enhanced = `${transition}, ${enhanced}`;
    }

    // Add thinking expressions
    if (this.config.enableThinkingPauses && Math.random() < 0.3) {
      const thinking = this.selectRandom(pattern.thinking);
      enhanced = this.insertThinking(enhanced, thinking);
    }

    // Add self-corrections based on personality
    if (this.config.enableSelfCorrections && behavior?.verbosity !== 'concise' && Math.random() < 0.2) {
      enhanced = this.addSelfCorrection(enhanced);
    }

    return enhanced;
  }

  /**
   * Generate acknowledgment for another agent's point
   */
  generateAcknowledgment(agentId: string, targetAgent: string, agreementLevel: number): string {
    const pattern = this.agentPatterns.get(agentId) || this.agentPatterns.get('default')!;
    const acknowledgment = this.selectRandom(pattern.acknowledgments);
    
    if (agreementLevel > 0.7) {
      return `${acknowledgment}, ${targetAgent} makes an excellent point.`;
    } else if (agreementLevel > 0.3) {
      return `${acknowledgment}, though I'd add some nuance to what ${targetAgent} said.`;
    } else {
      return `${acknowledgment}, but I have to disagree with ${targetAgent} on this.`;
    }
  }

  /**
   * Add pause markers for TTS
   */
  addPauseMarkers(text: string, behavior?: AgentBehavior): string {
    let pausedText = text;

    // Add thinking pauses
    if (behavior?.thinkingPattern === 'deliberate') {
      pausedText = pausedText.replace(/\. /g, '. <pause:1.5> ');
    } else if (behavior?.thinkingPattern === 'analytical') {
      pausedText = pausedText.replace(/\, /g, ', <pause:0.5> ');
    }

    // Add emphasis pauses
    pausedText = pausedText.replace(/! /g, '! <pause:0.8> ');
    pausedText = pausedText.replace(/\? /g, '? <pause:1.0> ');

    return pausedText;
  }

  /**
   * Generate a natural transition between speakers
   */
  generateTransition(
    fromAgent: string, 
    toAgent: string, 
    context: { topic?: string; isAgreement?: boolean }
  ): string {
    const toPattern = this.agentPatterns.get(toAgent) || this.agentPatterns.get('default')!;
    
    if (context.isAgreement) {
      return this.selectRandom([
        'Building on that point...',
        'I\'d like to add to what was just said...',
        'Following up on that thought...'
      ]);
    } else {
      return this.selectRandom([
        'I see it differently...',
        'Let me offer another perspective...',
        'Actually, I think we should consider...'
      ]);
    }
  }

  /**
   * Insert thinking expression naturally into text
   */
  private insertThinking(text: string, thinking: string): string {
    const sentences = text.split('. ');
    if (sentences.length > 2) {
      const insertPoint = Math.floor(sentences.length / 2);
      sentences[insertPoint] = `${thinking}, ${sentences[insertPoint]}`;
      return sentences.join('. ');
    }
    return text;
  }

  /**
   * Add self-correction to text
   */
  private addSelfCorrection(text: string): string {
    const corrections = [
      'actually, let me rephrase that',
      'or rather',
      'what I mean to say is',
      'to put it another way'
    ];
    
    const sentences = text.split('. ');
    if (sentences.length > 1) {
      const correctionPoint = Math.floor(sentences.length * 0.6);
      const correction = this.selectRandom(corrections);
      sentences[correctionPoint] = `${sentences[correctionPoint]}... ${correction}, ${sentences[correctionPoint]}`;
      return sentences.join('. ');
    }
    return text;
  }

  /**
   * Select random element from array
   */
  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate reaction token
   */
  generateReaction(
    agentId: string, 
    reactionType: 'agreement' | 'disagreement' | 'surprise' | 'thinking'
  ): string {
    const reactions = {
      agreement: ['Exactly!', 'I agree', 'That\'s right', 'Absolutely', 'Yes, precisely'],
      disagreement: ['Actually...', 'I disagree', 'Not quite', 'Hold on', 'But wait'],
      surprise: ['Interesting!', 'Really?', 'That\'s surprising', 'Wow', 'Oh!'],
      thinking: ['Hmm...', 'Let me think', 'Good point', 'I see', 'Ah...']
    };

    // Agent-specific variations
    if (agentId === 'bull' && reactionType === 'agreement') {
      return this.selectRandom(['Absolutely!', 'Yes! Exactly!', 'That\'s the opportunity!']);
    } else if (agentId === 'bear' && reactionType === 'disagreement') {
      return this.selectRandom(['But consider the risks...', 'I\'m not so sure...', 'That concerns me...']);
    } else if (agentId === 'skeptic' && reactionType === 'thinking') {
      return this.selectRandom(['Wait, let me question that...', 'Hmm, but what if...', 'I wonder though...']);
    }

    return this.selectRandom(reactions[reactionType]);
  }
}
