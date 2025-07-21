/**
 * Filing Reference Formatter - Optimized for Performance
 * Identifies and formats direct references from filing content in blue text
 */

export interface FilingReference {
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export class FilingReferenceFormatter {
  private static readonly MIN_REFERENCE_LENGTH = 10;
  private static readonly MAX_REFERENCE_LENGTH = 500;
  private static readonly CONFIDENCE_THRESHOLD = 0.7;
  
  // Cache for processed filing contents to avoid reprocessing
  private static filingContentCache = new Map<string, string>();
  private static referenceCache = new Map<string, FilingReference[]>();

  /**
   * Format message content by highlighting filing references in blue
   */
  static formatWithFilingReferences(
    content: string, 
    filingContents: string[] = []
  ): string {
    if (!content || filingContents.length === 0) {
      return content;
    }

    // Create cache key for this content + filing combination
    const cacheKey = this.createCacheKey(content, filingContents);
    
    // Check if we've already processed this combination
    const cachedReferences = this.referenceCache.get(cacheKey);
    if (cachedReferences) {
      return this.applyReferencesFromCache(content, cachedReferences);
    }

    // Find all potential filing references
    const references = this.findFilingReferences(content, filingContents);
    
    // Cache the references for future use
    this.referenceCache.set(cacheKey, references);
    
    if (references.length === 0) {
      return content;
    }

    return this.applyReferencesFromCache(content, references);
  }

  /**
   * Apply cached references to content
   */
  private static applyReferencesFromCache(content: string, references: FilingReference[]): string {
    if (references.length === 0) return content;

    // Sort references by start index in descending order to avoid index shifting
    const sortedRefs = [...references].sort((a, b) => b.startIndex - a.startIndex);

    let formattedContent = content;

    // Apply blue text formatting to each reference
    for (const reference of sortedRefs) {
      const beforeText = formattedContent.substring(0, reference.startIndex);
      const referenceText = formattedContent.substring(reference.startIndex, reference.endIndex);
      const afterText = formattedContent.substring(reference.endIndex);

      // Wrap the reference in a span with blue color class
      const formattedReference = `<span style="color: #3b82f6; font-weight: 500;">${referenceText}</span>`;
      
      formattedContent = beforeText + formattedReference + afterText;
    }

    return formattedContent;
  }

  /**
   * Create cache key for content + filing combination
   */
  private static createCacheKey(content: string, filingContents: string[]): string {
    // Use a hash-like approach for cache key to avoid memory issues
    const contentHash = this.simpleHash(content.substring(0, 200)); // First 200 chars
    const filingHash = this.simpleHash(filingContents.join('').substring(0, 500)); // First 500 chars
    return `${contentHash}-${filingHash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Find potential filing references in the content (optimized)
   */
  private static findFilingReferences(
    content: string, 
    filingContents: string[]
  ): FilingReference[] {
    const references: FilingReference[] = [];
    
    // Get or create cached combined filing content
    const filingCacheKey = filingContents.join('|');
    let combinedFilingContent = this.filingContentCache.get(filingCacheKey);
    
    if (!combinedFilingContent) {
      combinedFilingContent = filingContents.join(' ').toLowerCase();
      this.filingContentCache.set(filingCacheKey, combinedFilingContent);
      
      // Limit cache size to prevent memory issues
      if (this.filingContentCache.size > 50) {
        const firstKey = this.filingContentCache.keys().next().value;
        if (firstKey) {
          this.filingContentCache.delete(firstKey);
        }
      }
    }
    
    // Extract phrases more efficiently
    const phrases = this.extractPhrasesOptimized(content);
    
    // Process phrases in batches to avoid blocking the UI
    for (const phrase of phrases) {
      const confidence = this.calculateReferenceConfidenceOptimized(phrase.text, combinedFilingContent);
      
      if (confidence >= this.CONFIDENCE_THRESHOLD) {
        references.push({
          text: phrase.text,
          startIndex: phrase.startIndex,
          endIndex: phrase.endIndex,
          confidence
        });
      }
    }

    // Remove overlapping references, keeping the highest confidence ones
    return this.removeOverlappingReferences(references);
  }

  /**
   * Extract phrases from content for reference matching (optimized)
   */
  private static extractPhrasesOptimized(content: string): Array<{text: string, startIndex: number, endIndex: number}> {
    const phrases: Array<{text: string, startIndex: number, endIndex: number}> = [];
    
    // Prioritize quoted text (most likely to be direct references)
    const quotedRegex = /"([^"]{10,500})"/g;
    let quotedMatch;
    while ((quotedMatch = quotedRegex.exec(content)) !== null) {
      phrases.push({
        text: quotedMatch[0], // Include the quotes
        startIndex: quotedMatch.index,
        endIndex: quotedMatch.index + quotedMatch[0].length
      });
    }

    // Extract financial figures with context (high priority)
    const financialRegex = /\$[\d,]+(?:\.\d{2})?(?:\s+(?:million|billion|thousand))?/g;
    let financialMatch;
    while ((financialMatch = financialRegex.exec(content)) !== null) {
      // Expand to include surrounding context (limited expansion for performance)
      const contextStart = Math.max(0, financialMatch.index - 30);
      const contextEnd = Math.min(content.length, financialMatch.index + financialMatch[0].length + 30);
      const contextText = content.substring(contextStart, contextEnd).trim();
      
      if (contextText.length >= this.MIN_REFERENCE_LENGTH && 
          contextText.length <= this.MAX_REFERENCE_LENGTH) {
        phrases.push({
          text: contextText,
          startIndex: contextStart,
          endIndex: contextEnd
        });
      }
    }

    // Extract sentences (lower priority, limited to avoid performance issues)
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    let currentIndex = 0;
    
    // Limit sentence processing to avoid performance issues
    const maxSentences = Math.min(sentences.length, 20);
    
    for (let i = 0; i < maxSentences; i++) {
      const sentence = sentences[i];
      const startIndex = content.indexOf(sentence, currentIndex);
      if (startIndex !== -1) {
        const trimmedSentence = sentence.trim();
        if (trimmedSentence.length >= this.MIN_REFERENCE_LENGTH && 
            trimmedSentence.length <= this.MAX_REFERENCE_LENGTH) {
          phrases.push({
            text: trimmedSentence,
            startIndex,
            endIndex: startIndex + sentence.length
          });
        }
        currentIndex = startIndex + sentence.length;
      }
    }

    return phrases;
  }

  /**
   * Calculate confidence that a phrase is a direct filing reference (optimized)
   */
  private static calculateReferenceConfidenceOptimized(phrase: string, filingContent: string): number {
    const normalizedPhrase = this.normalizeTextOptimized(phrase);
    
    // Quick exact match check first
    if (filingContent.includes(normalizedPhrase)) {
      return 1.0;
    }

    // Fast confidence boosters
    let confidenceBoost = 0;
    
    // Check for quoted text (fastest check)
    if (phrase.includes('"')) {
      confidenceBoost += 0.4;
    }
    
    // Check for financial data (regex-based, faster than word matching)
    if (this.containsFinancialDataOptimized(phrase)) {
      confidenceBoost += 0.3;
    }
    
    // Check for filing language (limited set for performance)
    if (this.containsFilingLanguageOptimized(phrase)) {
      confidenceBoost += 0.2;
    }

    // Only do expensive word matching if we have some confidence already
    if (confidenceBoost > 0.2) {
      const words = normalizedPhrase.split(/\s+/);
      if (words.length >= 3) {
        let matchingWords = 0;
        // Limit word checking for performance
        const maxWords = Math.min(words.length, 10);
        
        for (let i = 0; i < maxWords; i++) {
          const word = words[i];
          if (word.length > 3 && filingContent.includes(word)) {
            matchingWords++;
          }
        }
        
        const wordMatchRatio = matchingWords / maxWords;
        confidenceBoost += wordMatchRatio * 0.3;
      }
    }
    
    return Math.min(1.0, confidenceBoost);
  }

  /**
   * Check if phrase contains typical filing language (optimized)
   */
  private static containsFilingLanguageOptimized(phrase: string): boolean {
    const lowerPhrase = phrase.toLowerCase();
    
    // Reduced set of most common filing terms for performance
    return lowerPhrase.includes('pursuant to') ||
           lowerPhrase.includes('fiscal year') ||
           lowerPhrase.includes('form 10-') ||
           lowerPhrase.includes('sec') ||
           lowerPhrase.includes('gaap') ||
           lowerPhrase.includes('management believes');
  }

  /**
   * Check if phrase contains financial data (optimized)
   */
  private static containsFinancialDataOptimized(phrase: string): boolean {
    // Use simple string checks instead of regex for better performance
    return phrase.includes('$') ||
           phrase.includes('%') ||
           phrase.toLowerCase().includes('revenue') ||
           phrase.toLowerCase().includes('profit') ||
           phrase.toLowerCase().includes('earnings');
  }

  /**
   * Normalize text for comparison (optimized)
   */
  private static normalizeTextOptimized(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Remove overlapping references, keeping highest confidence ones
   */
  private static removeOverlappingReferences(references: FilingReference[]): FilingReference[] {
    if (references.length <= 1) return references;
    
    // Sort by confidence descending
    references.sort((a, b) => b.confidence - a.confidence);
    
    const nonOverlapping: FilingReference[] = [];
    
    for (const reference of references) {
      const hasOverlap = nonOverlapping.some(existing => 
        this.rangesOverlap(
          reference.startIndex, reference.endIndex,
          existing.startIndex, existing.endIndex
        )
      );
      
      if (!hasOverlap) {
        nonOverlapping.push(reference);
      }
    }
    
    // Sort by start index for final output
    return nonOverlapping.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Check if two ranges overlap
   */
  private static rangesOverlap(
    start1: number, end1: number,
    start2: number, end2: number
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Extract filing contents from message context for reference matching
   */
  static extractFilingContents(messages: any[]): string[] {
    const filingContents: string[] = [];
    
    // Look for system messages that contain filing content
    for (const message of messages) {
      if (message.role === 'system' && message.content) {
        // Extract content that looks like filing data
        const content = message.content;
        if (content.includes('10-K') || content.includes('10-Q') || 
            content.includes('Filed:') || content.includes('Form ')) {
          filingContents.push(content);
        }
      }
    }
    
    return filingContents;
  }

  /**
   * Clear caches to free memory
   */
  static clearCaches(): void {
    this.filingContentCache.clear();
    this.referenceCache.clear();
  }
}
