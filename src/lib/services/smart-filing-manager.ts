// src/lib/services/smart-filing-manager.ts
import { cleanHtml } from '../utils/filing-truncator';

export interface FilingChunk {
  id: string;
  filingId: string;
  section: string;
  content: string;
  priority: number;
  tokenCount: number;
  relevanceScore: number;
  metadata: {
    formType: string;
    filingDate: string;
    companyName: string;
    sectionType: 'financial_statements' | 'mda' | 'business_overview' | 'risk_factors' | 'segment_performance' | 'cash_flow' | 'balance_sheet' | 'income_statement' | 'other';
  };
}

export interface SmartFilingSession {
  id: string;
  filings: FilingChunk[];
  activeChunks: FilingChunk[];
  totalTokens: number;
  maxTokens: number;
  lastQuery?: string;
  queryContext: string[];
}

export class SmartFilingManager {
  private static readonly MAX_TOKENS = 15000; // Conservative limit for context window
  private static readonly CHUNK_SIZE = 2000; // Optimal chunk size for processing
  
  // Section priorities based on typical investor queries
  private static readonly SECTION_PRIORITIES: Record<string, number> = {
    'financial_statements': 10,
    'mda': 9,
    'business_overview': 8,
    'risk_factors': 7,
    'segment_performance': 6,
    'cash_flow': 8,
    'balance_sheet': 7,
    'income_statement': 9,
    'other': 3
  };

  // Keywords that indicate high-value content
  private static readonly HIGH_VALUE_KEYWORDS = [
    'revenue', 'profit', 'margin', 'growth', 'earnings', 'cash flow',
    'segment', 'market share', 'competitive', 'strategy', 'outlook',
    'guidance', 'risk', 'opportunity', 'investment', 'capital'
  ];

  /**
   * Process multiple filings into smart chunks
   */
  static processFilings(filings: any[]): SmartFilingSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const allChunks: FilingChunk[] = [];

    filings.forEach((filing, index) => {
      const chunks = this.chunkFiling(filing, index);
      allChunks.push(...chunks);
    });

    // Sort by priority and relevance
    allChunks.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return b.relevanceScore - a.relevanceScore;
    });

    // Select initial active chunks within token limit
    const activeChunks = this.selectOptimalChunks(allChunks, this.MAX_TOKENS);

    return {
      id: sessionId,
      filings: allChunks,
      activeChunks,
      totalTokens: activeChunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0),
      maxTokens: this.MAX_TOKENS,
      queryContext: []
    };
  }

  /**
   * Dynamically adjust active chunks based on user query
   */
  static optimizeForQuery(session: SmartFilingSession, query: string): SmartFilingSession {
    const queryKeywords = this.extractKeywords(query.toLowerCase());
    const queryType = this.classifyQuery(query);

    // Re-score chunks based on query relevance
    const rescored = session.filings.map(chunk => ({
      ...chunk,
      relevanceScore: this.calculateQueryRelevance(chunk, queryKeywords, queryType)
    }));

    // Sort by new relevance scores
    rescored.sort((a, b) => {
      const relevanceDiff = b.relevanceScore - a.relevanceScore;
      if (relevanceDiff !== 0) return relevanceDiff;
      return b.priority - a.priority;
    });

    // Select new optimal chunks
    const newActiveChunks = this.selectOptimalChunks(rescored, this.MAX_TOKENS);

    return {
      ...session,
      activeChunks: newActiveChunks,
      totalTokens: newActiveChunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0),
      lastQuery: query,
      queryContext: [...session.queryContext, query].slice(-5) // Keep last 5 queries
    };
  }

  /**
   * Get context summary for the AI
   */
  static getContextSummary(session: SmartFilingSession): string {
    const filingTypes = Array.from(new Set(session.activeChunks.map(c => c.metadata.formType)));
    const companies = Array.from(new Set(session.activeChunks.map(c => c.metadata.companyName)));
    const sectionTypes = Array.from(new Set(session.activeChunks.map(c => c.metadata.sectionType)));

    return `
Context: Analyzing ${session.activeChunks.length} optimized sections from ${filingTypes.join(', ')} filings for ${companies.join(', ')}.
Active sections: ${sectionTypes.join(', ')}
Token usage: ${session.totalTokens}/${session.maxTokens} (${Math.round(session.totalTokens/session.maxTokens*100)}%)
Query context: ${session.queryContext.length > 0 ? session.queryContext.slice(-2).join(' → ') : 'Initial analysis'}
`;
  }

  /**
   * Get formatted content for AI processing
   */
  static getFormattedContent(session: SmartFilingSession): string {
    return session.activeChunks
      .map(chunk => `
=== ${chunk.metadata.formType} | ${chunk.section} | ${chunk.metadata.filingDate} ===
${chunk.content}
`)
      .join('\n\n');
  }

  private static chunkFiling(filing: any, filingIndex: number): FilingChunk[] {
    const cleanedContent = cleanHtml(filing.content);
    const sections = this.extractSections(cleanedContent);
    const chunks: FilingChunk[] = [];

    sections.forEach((section, sectionIndex) => {
      const sectionChunks = this.splitIntoChunks(section.content, this.CHUNK_SIZE);
      
      sectionChunks.forEach((chunkContent, chunkIndex) => {
        const sectionType = this.classifySectionType(section.title, chunkContent);
        const priority = this.SECTION_PRIORITIES[sectionType] || 3;
        const relevanceScore = this.calculateRelevanceScore(chunkContent);
        
        chunks.push({
          id: `${filing.accessionNumber}_${sectionIndex}_${chunkIndex}`,
          filingId: filing.accessionNumber,
          section: section.title,
          content: chunkContent,
          priority,
          tokenCount: this.estimateTokens(chunkContent),
          relevanceScore,
          metadata: {
            formType: filing.form,
            filingDate: filing.filingDate,
            companyName: filing.companyName,
            sectionType
          }
        });
      });
    });

    return chunks;
  }

  private static extractSections(content: string): Array<{title: string, content: string}> {
    // Enhanced section extraction with better patterns
    const sections: Array<{title: string, content: string}> = [];
    
    // Split by Item headers (10-K/10-Q structure)
    const itemSections = content.split(/(?=Item\s+\d+[A-Z]?\.)/gi);
    
    itemSections.forEach(section => {
      const lines = section.trim().split('\n');
      if (lines.length < 2) return;
      
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      if (content.length > 100) { // Only include substantial sections
        sections.push({ title, content });
      }
    });

    // If no Item sections found, split by major headings
    if (sections.length === 0) {
      const headingSections = content.split(/(?=^[A-Z][A-Z\s]{10,}$)/gm);
      headingSections.forEach(section => {
        const lines = section.trim().split('\n');
        if (lines.length > 1) {
          sections.push({
            title: lines[0].trim(),
            content: lines.slice(1).join('\n').trim()
          });
        }
      });
    }

    return sections.length > 0 ? sections : [{ title: 'Full Document', content }];
  }

  private static splitIntoChunks(content: string, chunkSize: number): string[] {
    const words = content.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 50) { // Only include meaningful chunks
        chunks.push(chunk);
      }
    }
    
    return chunks.length > 0 ? chunks : [content];
  }

  private static classifySectionType(title: string, content: string): 'financial_statements' | 'mda' | 'business_overview' | 'risk_factors' | 'segment_performance' | 'cash_flow' | 'balance_sheet' | 'income_statement' | 'other' {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (titleLower.includes('financial') || titleLower.includes('statement') || 
        contentLower.includes('balance sheet') || contentLower.includes('income statement')) {
      return 'financial_statements';
    }
    
    if (titleLower.includes('management') || titleLower.includes('discussion') || 
        titleLower.includes('analysis') || titleLower.includes('mda')) {
      return 'mda';
    }
    
    if (titleLower.includes('business') || titleLower.includes('overview') || 
        titleLower.includes('operations')) {
      return 'business_overview';
    }
    
    if (titleLower.includes('risk') || titleLower.includes('factor')) {
      return 'risk_factors';
    }
    
    if (titleLower.includes('segment') || contentLower.includes('segment')) {
      return 'segment_performance';
    }
    
    return 'other';
  }

  private static calculateRelevanceScore(content: string): number {
    const contentLower = content.toLowerCase();
    let score = 0;
    
    // Score based on high-value keywords
    this.HIGH_VALUE_KEYWORDS.forEach(keyword => {
      const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
      score += matches * 2;
    });
    
    // Bonus for financial data patterns
    const numberPatterns = [
      /\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|thousand))?/gi,
      /\d+(?:\.\d+)?%/g,
      /\d{4}\s*(?:fiscal|calendar)?\s*year/gi
    ];
    
    numberPatterns.forEach(pattern => {
      const matches = (content.match(pattern) || []).length;
      score += matches;
    });
    
    // Length bonus (longer sections often more valuable)
    score += Math.min(content.length / 1000, 5);
    
    return score;
  }

  private static calculateQueryRelevance(chunk: FilingChunk, queryKeywords: string[], queryType: string): number {
    const contentLower = chunk.content.toLowerCase();
    let relevance = chunk.relevanceScore; // Base relevance
    
    // Keyword matching bonus
    queryKeywords.forEach(keyword => {
      const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
      relevance += matches * 5;
    });
    
    // Section type matching bonus
    if (queryType === 'financial' && chunk.metadata.sectionType === 'financial_statements') {
      relevance += 10;
    } else if (queryType === 'business' && chunk.metadata.sectionType === 'business_overview') {
      relevance += 10;
    } else if (queryType === 'risk' && chunk.metadata.sectionType === 'risk_factors') {
      relevance += 10;
    }
    
    return relevance;
  }

  private static extractKeywords(query: string): string[] {
    // Remove common words and extract meaningful keywords
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'what', 'how', 'when', 'where', 'why', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'about', 'analyze', 'analysis', 'show', 'tell', 'explain']);
    
    return query
      .split(/\s+/)
      .map(word => word.replace(/[^\w]/g, '').toLowerCase())
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  private static classifyQuery(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('revenue') || queryLower.includes('profit') || 
        queryLower.includes('financial') || queryLower.includes('earnings')) {
      return 'financial';
    }
    
    if (queryLower.includes('business') || queryLower.includes('strategy') || 
        queryLower.includes('operations') || queryLower.includes('market')) {
      return 'business';
    }
    
    if (queryLower.includes('risk') || queryLower.includes('threat') || 
        queryLower.includes('challenge')) {
      return 'risk';
    }
    
    return 'general';
  }

  private static selectOptimalChunks(chunks: FilingChunk[], maxTokens: number): FilingChunk[] {
    const selected: FilingChunk[] = [];
    let totalTokens = 0;
    
    // Ensure we have representation from different filings and section types
    const filingRepresentation = new Map<string, number>();
    const sectionRepresentation = new Map<string, number>();
    
    for (const chunk of chunks) {
      if (totalTokens + chunk.tokenCount <= maxTokens) {
        selected.push(chunk);
        totalTokens += chunk.tokenCount;
        
        filingRepresentation.set(chunk.filingId, (filingRepresentation.get(chunk.filingId) || 0) + 1);
        sectionRepresentation.set(chunk.metadata.sectionType, (sectionRepresentation.get(chunk.metadata.sectionType) || 0) + 1);
      }
    }
    
    return selected;
  }

  private static estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}
