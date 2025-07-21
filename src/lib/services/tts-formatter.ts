// TTS (Text-to-Speech) Formatter for Ultra-Concise Output
export class TTSFormatter {
  /**
   * Format content for text-to-speech - extremely brief and concise
   */
  static formatForTTS(content: string): string {
    let formatted = content;

    // Remove all markdown formatting
    formatted = this.removeMarkdown(formatted);
    
    // Simplify financial data
    formatted = this.simplifyFinancialData(formatted);
    
    // Remove redundant phrases
    formatted = this.removeRedundancy(formatted);
    
    // Shorten sentences
    formatted = this.shortenSentences(formatted);
    
    // Clean up final output
    formatted = this.cleanupForTTS(formatted);

    return formatted;
  }

  /**
   * Remove all markdown and formatting
   */
  private static removeMarkdown(content: string): string {
    return content
      // Remove headers
      .replace(/#{1,6}\s+/g, '')
      // Remove bold/italic
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
      // Remove code blocks
      .replace(/```[^`]*```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^---+$/gm, '')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove tables
      .replace(/\|[^|]+\|/g, '')
      .replace(/\|[-:]+\|/g, '')
      // Remove emojis (using surrogate pairs for ES5 compatibility)
      .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, '')
      .replace(/[\u2600-\u26FF]/g, '');
  }

  /**
   * Simplify financial numbers and data
   */
  private static simplifyFinancialData(content: string): string {
    return content
      // Convert billions
      .replace(/\$(\d{1,3}),?(\d{3}),?(\d{3}),?(\d{3})/g, (match, p1) => `${p1} billion dollars`)
      .replace(/\$(\d{1,3})\.(\d+)\s*billion/gi, '$1 point $2 billion dollars')
      
      // Convert millions
      .replace(/\$(\d{1,3}),?(\d{3}),?(\d{3})/g, (match, p1) => `${p1} million dollars`)
      .replace(/\$(\d{1,3})\.(\d+)\s*million/gi, '$1 point $2 million dollars')
      
      // Convert thousands
      .replace(/\$(\d{1,3}),?(\d{3})/g, '$1 thousand dollars')
      
      // Simplify percentages
      .replace(/(\d+)\.(\d{2,})%/g, '$1 point $2 percent')
      .replace(/(\d+)%/g, '$1 percent')
      
      // Remove decimal precision beyond 1 place
      .replace(/(\d+\.\d)\d+/g, '$1')
      
      // Convert dates to spoken format
      .replace(/Q(\d)\s+(\d{4})/g, 'quarter $1 $2')
      .replace(/FY\s+(\d{4})/g, 'fiscal year $1')
      
      // Simplify ratios
      .replace(/P\/E/g, 'price to earnings')
      .replace(/EPS/g, 'earnings per share')
      .replace(/ROE/g, 'return on equity')
      .replace(/ROA/g, 'return on assets')
      .replace(/EBITDA/g, 'earnings');
  }

  /**
   * Remove redundant and filler phrases
   */
  private static removeRedundancy(content: string): string {
    return content
      // Remove filler phrases and self-referential language
      .replace(/\b(basically|essentially|actually|really|just|very|quite|rather|somewhat|fairly)\b/gi, '')
      .replace(/\b(I am|I'm|I|we are|we're|we|as an? AI|as a financial analyst|thank you|thanks|please)\b/gi, '')
      
      // Remove redundant connectors
      .replace(/\b(furthermore|additionally|moreover|nevertheless|however|therefore|consequently)\b/gi, '')
      
      // Remove wordy phrases
      .replace(/Based on the (?:filings?|data|analysis)/gi, '')
      .replace(/According to the (?:filings?|documents?|data)/gi, '')
      .replace(/It is worth noting that/gi, '')
      .replace(/It's important to (?:note|mention) that/gi, '')
      .replace(/In terms of/gi, 'For')
      .replace(/With regard to/gi, 'About')
      .replace(/In order to/gi, 'To')
      .replace(/Due to the fact that/gi, 'Because')
      
      // Remove source citations
      .replace(/\((?:as )?(?:per|according to|from|in) the (?:10-[KQ]|8-K|filing|document)[^)]*\)/gi, '')
      .replace(/(?:as )?(?:mentioned|stated|noted) in the (?:10-[KQ]|8-K|filing)/gi, '')
      
      // Remove section references
      .replace(/In the \w+ section(?:\s+of the filing)?/gi, '')
      .replace(/The filing (?:shows|indicates|reveals|states)/gi, '')
      
      // Simplify comparisons
      .replace(/compared to/gi, 'versus')
      .replace(/in comparison with/gi, 'versus')
      .replace(/as opposed to/gi, 'versus')
      .replace(/year-over-year/gi, 'yearly')
      .replace(/quarter-over-quarter/gi, 'quarterly');
  }

  /**
   * Shorten sentences and make them more direct
   */
  private static shortenSentences(content: string): string {
    return content
      // Split into sentences
      .split(/(?<=[.!?])\s+/)
      .map(sentence => {
        let shortened = sentence.trim();
        
        // Skip very short sentences
        if (shortened.length < 20) return shortened;
        
        // Remove parenthetical information
        shortened = shortened.replace(/\s*\([^)]+\)\s*/g, ' ');
        
        // Remove "which/that" clauses when possible
        shortened = shortened.replace(/,\s*which\s+[^,]+,/g, ',');
        
        // Simplify complex phrases
        shortened = shortened
          .replace(/The company's/gi, 'Their')
          .replace(/The organization's/gi, 'Their')
          .replace(/has been/g, 'was')
          .replace(/have been/g, 'were')
          .replace(/will be able to/g, 'can')
          .replace(/is going to/g, 'will');
        
        return shortened;
      })
      .filter(s => s.length > 0)
      .join('. ');
  }

  /**
   * Final cleanup for TTS output
   */
  private static cleanupForTTS(content: string): string {
    return content
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      
      // Remove empty parentheses
      .replace(/\(\s*\)/g, '')
      
      // Fix punctuation spacing
      .replace(/\s+([.,!?])/g, '$1')
      .replace(/([.,!?])(?=[A-Za-z])/g, '$1 ')
      
      // Remove duplicate punctuation
      .replace(/([.!?])\1+/g, '$1')
      
      // Ensure sentences end with periods
      .replace(/([A-Za-z0-9])\s*$/g, '$1.')
      
      // Remove leading/trailing whitespace
      .trim()
      
      // Limit total length for TTS chunks
      .split('. ')
      .reduce((acc, sentence, index) => {
        // Keep only the most important sentences (first 10)
        if (index < 10 && acc.length + sentence.length < 1000) {
          return acc + (acc ? '. ' : '') + sentence;
        }
        return acc;
      }, '');
  }

  /**
   * Extract only the key points for ultra-brief summary
   */
  static extractKeyPoints(content: string): string {
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
    const keyPoints: string[] = [];
    
    // Priority patterns for key information
    const priorityPatterns = [
      /revenue.*\d+.*(?:billion|million)/i,
      /profit.*\d+.*(?:billion|million)/i,
      /earnings.*\d+.*(?:billion|million)/i,
      /growth.*\d+.*percent/i,
      /increase.*\d+.*percent/i,
      /decrease.*\d+.*percent/i,
      /margin.*\d+.*percent/i,
      /cash.*\d+.*(?:billion|million)/i,
      /debt.*\d+.*(?:billion|million)/i,
      /guidance.*\d+/i
    ];
    
    // Find sentences matching priority patterns
    sentences.forEach(sentence => {
      if (keyPoints.length >= 5) return; // Limit to 5 key points
      
      for (const pattern of priorityPatterns) {
        if (pattern.test(sentence) && !keyPoints.includes(sentence)) {
          keyPoints.push(this.formatForTTS(sentence));
          break;
        }
      }
    });
    
    // If we don't have enough key points, add the first few sentences
    if (keyPoints.length < 3) {
      sentences.slice(0, 3 - keyPoints.length).forEach(s => {
        const formatted = this.formatForTTS(s);
        if (!keyPoints.includes(formatted)) {
          keyPoints.push(formatted);
        }
      });
    }
    
    return keyPoints.join('. ');
  }

  /**
   * Create ultra-brief summary for TTS
   */
  static createTTSSummary(content: string): string {
    const formatted = this.formatForTTS(content);
    const keyPoints = this.extractKeyPoints(formatted);
    
    // If key points are too long, truncate further
    if (keyPoints.length > 500) {
      return keyPoints.substring(0, 497) + '...';
    }
    
    return keyPoints;
  }
}
