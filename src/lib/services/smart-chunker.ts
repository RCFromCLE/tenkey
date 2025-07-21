import { encode } from 'gpt-tokenizer';

interface ChunkResult {
  chunks: string[];
  totalTokens: number;
  chunkCount: number;
}

interface ChunkOptions {
  maxTokensPerChunk: number;
  preserveSections: boolean;
  overlapTokens: number;
}

export class SmartChunker {
  private static readonly DEFAULT_OPTIONS: ChunkOptions = {
    maxTokensPerChunk: 120000, // Leave some buffer for system prompt and user message
    preserveSections: true,
    overlapTokens: 1000 // Small overlap to maintain context
  };

  /**
   * Count tokens in text using GPT tokenizer
   */
  static countTokens(text: string): number {
    try {
      return encode(text).length;
    } catch (error) {
      // Fallback to character-based estimation if tokenizer fails
      return Math.ceil(text.length / 4); // Rough estimate: 4 chars per token
    }
  }

  /**
   * Check if content needs to be chunked
   */
  static needsChunking(systemPrompt: string, userMessages: any[], maxTokens: number = 128000): boolean {
    const systemTokens = this.countTokens(systemPrompt);
    const messageTokens = userMessages.reduce((total, msg) => total + this.countTokens(msg.content), 0);
    const totalTokens = systemTokens + messageTokens + 4000; // Buffer for response
    
    console.log(`Token analysis: System=${systemTokens}, Messages=${messageTokens}, Total=${totalTokens}, Limit=${maxTokens}`);
    
    return totalTokens > maxTokens;
  }

  /**
   * Split filing content into smart chunks that preserve context
   */
  static chunkFilingContent(content: string, options: Partial<ChunkOptions> = {}): ChunkResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const chunks: string[] = [];
    let totalTokens = 0;

    // If content is small enough, return as single chunk
    const contentTokens = this.countTokens(content);
    if (contentTokens <= opts.maxTokensPerChunk) {
      return {
        chunks: [content],
        totalTokens: contentTokens,
        chunkCount: 1
      };
    }

    console.log(`Content needs chunking: ${contentTokens} tokens > ${opts.maxTokensPerChunk} limit`);

    if (opts.preserveSections) {
      // Try to split by sections first
      const sectionChunks = this.chunkBySections(content, opts);
      if (sectionChunks.length > 1) {
        return {
          chunks: sectionChunks,
          totalTokens: contentTokens,
          chunkCount: sectionChunks.length
        };
      }
    }

    // Fall back to paragraph-based chunking
    const paragraphChunks = this.chunkByParagraphs(content, opts);
    if (paragraphChunks.length > 1) {
      return {
        chunks: paragraphChunks,
        totalTokens: contentTokens,
        chunkCount: paragraphChunks.length
      };
    }

    // Last resort: sentence-based chunking
    const sentenceChunks = this.chunkBySentences(content, opts);
    return {
      chunks: sentenceChunks,
      totalTokens: contentTokens,
      chunkCount: sentenceChunks.length
    };
  }

  /**
   * Split content by sections (Item 1, Item 2, etc.)
   */
  private static chunkBySections(content: string, opts: ChunkOptions): string[] {
    const chunks: string[] = [];
    
    // Split by common SEC filing sections
    const sectionPatterns = [
      /(?=Item \d+[A-Z]?\.)/g,
      /(?=PART [IVX]+)/g,
      /(?=Table of Contents)/g,
      /(?=BUSINESS)/g,
      /(?=RISK FACTORS)/g,
      /(?=MANAGEMENT'S DISCUSSION)/g,
      /(?=FINANCIAL STATEMENTS)/g
    ];

    let sections: string[] = [content];
    
    // Try each pattern to find the best split
    for (const pattern of sectionPatterns) {
      const testSections = content.split(pattern).filter(s => s.trim().length > 0);
      if (testSections.length > sections.length) {
        sections = testSections;
      }
    }

    // Group sections into chunks that fit within token limits
    let currentChunk = '';
    let currentTokens = 0;

    for (const section of sections) {
      const sectionTokens = this.countTokens(section);
      
      // If section alone exceeds limit, split it further
      if (sectionTokens > opts.maxTokensPerChunk) {
        // Save current chunk if it has content
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
          currentTokens = 0;
        }
        
        // Split the large section
        const subChunks = this.chunkByParagraphs(section, opts);
        chunks.push(...subChunks);
        continue;
      }
      
      // Check if adding this section would exceed limit
      if (currentTokens + sectionTokens > opts.maxTokensPerChunk && currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = section;
        currentTokens = sectionTokens;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + section;
        currentTokens += sectionTokens;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 1 ? chunks : [];
  }

  /**
   * Split content by paragraphs
   */
  private static chunkByParagraphs(content: string, opts: ChunkOptions): string[] {
    const chunks: string[] = [];
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    let currentChunk = '';
    let currentTokens = 0;

    for (const paragraph of paragraphs) {
      const paragraphTokens = this.countTokens(paragraph);
      
      // If paragraph alone exceeds limit, split by sentences
      if (paragraphTokens > opts.maxTokensPerChunk) {
        // Save current chunk if it has content
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
          currentTokens = 0;
        }
        
        // Split the large paragraph
        const sentenceChunks = this.chunkBySentences(paragraph, opts);
        chunks.push(...sentenceChunks);
        continue;
      }
      
      // Check if adding this paragraph would exceed limit
      if (currentTokens + paragraphTokens > opts.maxTokensPerChunk && currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
        currentTokens = paragraphTokens;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentTokens += paragraphTokens;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 1 ? chunks : [];
  }

  /**
   * Split content by sentences (last resort)
   */
  private static chunkBySentences(content: string, opts: ChunkOptions): string[] {
    const chunks: string[] = [];
    const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.countTokens(sentence);
      
      // If single sentence exceeds limit, force split by characters
      if (sentenceTokens > opts.maxTokensPerChunk) {
        // Save current chunk if it has content
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
          currentTokens = 0;
        }
        
        // Force split by characters
        const charChunks = this.forceChunkByCharacters(sentence, opts);
        chunks.push(...charChunks);
        continue;
      }
      
      // Check if adding this sentence would exceed limit
      if (currentTokens + sentenceTokens > opts.maxTokensPerChunk && currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        currentTokens = sentenceTokens;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokens += sentenceTokens;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Force split by characters when all else fails
   */
  private static forceChunkByCharacters(content: string, opts: ChunkOptions): string[] {
    const chunks: string[] = [];
    const maxChars = Math.floor(opts.maxTokensPerChunk * 3.5); // Conservative estimate
    
    for (let i = 0; i < content.length; i += maxChars) {
      const chunk = content.slice(i, i + maxChars);
      chunks.push(chunk);
    }
    
    return chunks;
  }

  /**
   * Create multiple system prompts for chunked content
   */
  static createChunkedSystemPrompts(
    baseSystemPrompt: string,
    filings: any[],
    chunkResults: ChunkResult[]
  ): string[] {
    const systemPrompts: string[] = [];
    
    for (let filingIndex = 0; filingIndex < filings.length; filingIndex++) {
      const filing = filings[filingIndex];
      const chunkResult = chunkResults[filingIndex];
      
      for (let i = 0; i < chunkResult.chunks.length; i++) {
        const isFirstChunk = i === 0;
        const isLastChunk = i === chunkResult.chunks.length - 1;
        
        let systemPrompt = `${baseSystemPrompt}

Company: ${filing.companyName}
Filing Type: ${filing.form}
Filing Date: ${filing.filingDate}`;

        if (chunkResult.chunkCount > 1) {
          if (isFirstChunk) {
            systemPrompt += `

**Note: This filing is large and has been split into sections for analysis. This is the beginning of the ${filing.form} filing. Additional sections will follow to provide complete coverage.**`;
          } else if (isLastChunk) {
            systemPrompt += `

**Note: This is the final section of the ${filing.form} filing. Previous sections have already been analyzed.**`;
          } else {
            systemPrompt += `

**Note: This is a middle section of the ${filing.form} filing. Previous sections have been analyzed and additional sections will follow.**`;
          }
        }

        systemPrompt += `

${chunkResult.chunks[i]}`;

        systemPrompts.push(systemPrompt);
      }
    }
    
    return systemPrompts;
  }

  /**
   * Estimate total tokens for a conversation
   */
  static estimateConversationTokens(systemPrompt: string, messages: any[]): number {
    const systemTokens = this.countTokens(systemPrompt);
    const messageTokens = messages.reduce((total, msg) => total + this.countTokens(msg.content), 0);
    return systemTokens + messageTokens + 4000; // Buffer for response
  }
}
