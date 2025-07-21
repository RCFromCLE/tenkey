// Service to clean up AI responses by removing self-referential language and making them more concise

export class ResponseCleaner {
  /**
   * Clean AI response by removing self-referential phrases and announcements
   */
  static cleanResponse(content: string): string {
    if (!content) return content;
    
    // Remove AI self-references and announcements
    let cleaned = content
      // Remove self-referential phrases at the beginning of sentences
      .replace(/^As a financial analyst,?\s*/gim, '')
      .replace(/^I'll stick to the filings?\s*/gim, '')
      .replace(/^Based on my analysis,?\s*/gim, '')
      .replace(/^Let me analyze\s*/gim, '')
      .replace(/^I can see that\s*/gim, '')
      .replace(/^Looking at the (?:filings?|data|numbers),?\s*/gim, '')
      .replace(/^According to the (?:filings?|documents?|data),?\s*/gim, '')
      .replace(/^The filing (?:shows|indicates|reveals)\s*/gim, '')
      .replace(/^I (?:notice|observe|find) that\s*/gim, '')
      .replace(/^Allow me to\s*/gim, '')
      .replace(/^I'll (?:provide|give you|share)\s*/gim, '')
      .replace(/^Here's what I found:?\s*/gim, '')
      .replace(/^Here are the key (?:points|findings|insights):?\s*/gim, '')
      
      // Remove similar phrases in the middle of text
      .replace(/\. As a financial analyst,?\s*/gi, '. ')
      .replace(/\. I'll stick to the filings?\s*/gi, '. ')
      .replace(/\. Based on my analysis,?\s*/gi, '. ')
      .replace(/\. Let me\s*/gi, '. ')
      .replace(/\. I can see that\s*/gi, '. ')
      .replace(/\. Looking at the (?:filings?|data),?\s*/gi, '. ')
      .replace(/\. According to the (?:filings?|documents?),?\s*/gi, '. ')
      .replace(/\. The filing (?:shows|indicates)\s*/gi, '. ')
      .replace(/\. I (?:notice|observe|find) that\s*/gi, '. ')
      
      // Remove hedging language
      .replace(/\bIt appears that\s*/gi, '')
      .replace(/\bIt seems that\s*/gi, '')
      .replace(/\bBased on what I can see,?\s*/gi, '')
      .replace(/\bFrom what I understand,?\s*/gi, '')
      
      // Remove unnecessary transitions
      .replace(/\bFurthermore,\s*/gi, '')
      .replace(/\bAdditionally,\s*/gi, '')
      .replace(/\bMoreover,\s*/gi, '')
      .replace(/\bIn addition,\s*/gi, '')
      .replace(/\bTo elaborate,\s*/gi, '')
      .replace(/\bTo clarify,\s*/gi, '')
      
      // Clean up resulting issues
      .replace(/^\s*,\s*/, '') // Remove leading commas
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\.\s*\./g, '.') // Remove double periods
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Limit to double line breaks
      .trim();
    
    // Ensure sentences start with capital letters after cleanup
    cleaned = cleaned.replace(/(^|\. )([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    return cleaned;
  }

  /**
   * Make response more concise by removing redundant information
   */
  static makeConcise(content: string): string {
    return content
      // Remove repetitive filing references
      .replace(/\b(?:in|from|per) the (?:10-[KQ]|filing|document|report)\b/gi, '')
      .replace(/\baccording to the filing\b/gi, '')
      .replace(/\bthe filing (?:states|mentions|notes|indicates)\b/gi, '')
      
      // Shorten common phrases
      .replace(/\bcompared to the same period last year\b/gi, 'YoY')
      .replace(/\byear over year\b/gi, 'YoY')
      .replace(/\bquarter over quarter\b/gi, 'QoQ')
      .replace(/\bfor the (?:quarter|period) ended\b/gi, 'for')
      
      // Remove obvious context
      .replace(/\bThe company\b/g, 'They')
      .replace(/\bThe management\b/g, 'Management')
      
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * NO FORMATTING - Just return the content as-is
   */
  static enhanceFinancialData(content: string): string {
    // User wants NO formatting at all
    return content;
  }

  /**
   * Apply minimal cleaning only - NO formatting
   */
  static clean(content: string): string {
    // Just return the content as-is with minimal cleanup
    return content.trim();
  }
}
