/**
 * Content Filter Service
 * Prevents specific types of content from appearing in chat responses
 */

export class ContentFilter {
  private static instance: ContentFilter;
  
  // Patterns that should never appear in chat responses
  private static readonly FORBIDDEN_PATTERNS = [
    // Table-like structures with performance scenarios
    /Future\s+Performance\s+Outlook/gi,
    /Scenario\s*\|\s*Drivers\s*\|\s*Likelihood/gi,
    /Bull\s+Case\s*\|\s*Base\s+Case\s*\|\s*Bear\s+Case/gi,
    
    // Financial projection tables
    /\|\s*Scenario\s*\|\s*Drivers\s*\|\s*Likelihood\s*\|/gi,
    /\|\s*Bull\s+Case\s*\|\s*Base\s+Case\s*\|\s*Bear\s+Case\s*\|/gi,
    /\|\s*Copilot\s+reaches\s+\d+M\s+users/gi,
    /\|\s*Capex\s+normalizes\s+at\s+~\d+%/gi,
    /\|\s*GPU\s+shortages\s+delay/gi,
    
    // Performance outlook tables with percentages and scenarios
    /Azure\s+GM%\s+recovers\s+to\s+\d+%\+\s+by\s+FY\d+/gi,
    /Steady\s+\d+-\d+%\s+cloud\s+growth,\s+margins\s+stabilize/gi,
    /AI\s+adoption\s+plateaus;\s+regulatory\s+fines\s+escalate/gi,
    
    // Generic table structures that look like performance scenarios
    /\|\s*[-\s]*\|\s*[-\s]*\|\s*[-\s]*\|/g,
    /\|\s*\d+%\s*\|\s*\|\s*[A-Za-z\s]+\s*\|\s*-\s*[A-Za-z\s%\d+]+/gi,
    
    // Specific forbidden content patterns
    /Copilot\s+reaches\s+\d+M\s+users\s+by\s+FY\d+/gi,
    /Capex\s+normalizes\s+at\s+~\d+%\s+of\s+revenue/gi,
    /GPU\s+shortages\s+delay\s+Azure\s+scale/gi,
    
    // Table headers and structures
    /\|\s*Scenario\s*\|\s*Drivers\s*\|\s*Likelihood\s*\|\s*\|\s*Bull\s+Case\s*\|/gi,
    /•\s*Copilot\s+reaches\s+\d+M\s+users\s+by\s+FY\d+\s*\|\s*\d+%\s*\|\s*\|\s*Base\s+Case\s*\|/gi,
    /•\s*Capex\s+normalizes\s+at\s+~\d+%\s+of\s+revenue\s*\|\s*\d+%\s*\|\s*\|\s*Bear\s+Case\s*\|/gi,
    /•\s*GPU\s+shortages\s+delay\s+Azure\s+scale\s*\|\s*\d+%\s*\|/gi,
  ];

  // Additional patterns for table-like structures
  private static readonly TABLE_PATTERNS = [
    // ASCII table borders and separators
    /\+[-=]+\+[-=]+\+[-=]+\+/g,
    /\|[-\s]*\|[-\s]*\|[-\s]*\|/g,
    
    // Markdown table patterns
    /\|\s*:?[-]+:?\s*\|\s*:?[-]+:?\s*\|\s*:?[-]+:?\s*\|/g,
    
    // Performance scenario tables specifically
    /\|\s*[A-Za-z\s]+\s*\|\s*[A-Za-z\s%\d+-]+\s*\|\s*[A-Za-z\s%\d+-]+\s*\|/g,
  ];

  // Keywords that when combined suggest forbidden content
  private static readonly FORBIDDEN_KEYWORDS = [
    'future performance outlook',
    'scenario analysis',
    'bull case',
    'base case', 
    'bear case',
    'performance scenarios',
    'outlook table',
    'projection table',
    'forecast scenarios'
  ];

  static getInstance(): ContentFilter {
    if (!ContentFilter.instance) {
      ContentFilter.instance = new ContentFilter();
    }
    return ContentFilter.instance;
  }

  /**
   * Filter content to remove forbidden patterns
   */
  filterContent(content: string): string {
    let filteredContent = content;

    // Remove forbidden patterns
    for (const pattern of ContentFilter.FORBIDDEN_PATTERNS) {
      filteredContent = filteredContent.replace(pattern, '');
    }

    // Remove table-like structures
    for (const pattern of ContentFilter.TABLE_PATTERNS) {
      filteredContent = filteredContent.replace(pattern, '');
    }

    // Check for forbidden keyword combinations
    const contentLower = filteredContent.toLowerCase();
    for (const keyword of ContentFilter.FORBIDDEN_KEYWORDS) {
      if (contentLower.includes(keyword)) {
        // Remove the entire paragraph containing the forbidden keyword
        const lines = filteredContent.split('\n');
        filteredContent = lines.filter(line => 
          !line.toLowerCase().includes(keyword)
        ).join('\n');
      }
    }

    // Clean up any resulting empty lines or malformed content
    filteredContent = this.cleanupContent(filteredContent);

    return filteredContent;
  }

  /**
   * Check if content contains forbidden patterns
   */
  containsForbiddenContent(content: string): boolean {
    const contentLower = content.toLowerCase();

    // Check forbidden patterns
    for (const pattern of ContentFilter.FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check table patterns
    for (const pattern of ContentFilter.TABLE_PATTERNS) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check forbidden keywords
    for (const keyword of ContentFilter.FORBIDDEN_KEYWORDS) {
      if (contentLower.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clean up content after filtering
   */
  private cleanupContent(content: string): string {
    return content
      // Remove multiple consecutive empty lines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim()
      // Remove orphaned table separators
      .replace(/^\s*\|\s*$/gm, '')
      // Remove orphaned bullet points with no content
      .replace(/^\s*[•·-]\s*$/gm, '')
      // Clean up any remaining table artifacts
      .replace(/\|\s*\|\s*\|/g, '')
      .replace(/^\s*\|\s*/gm, '')
      .replace(/\s*\|\s*$/gm, '');
  }

  /**
   * Validate content before sending to user
   */
  validateContent(content: string): { isValid: boolean; filteredContent: string; warnings: string[] } {
    const warnings: string[] = [];
    let filteredContent = content;

    // Check for forbidden content
    if (this.containsForbiddenContent(content)) {
      warnings.push('Content contained forbidden table structures that were removed');
      filteredContent = this.filterContent(content);
    }

    // Additional validation for table-like structures
    const tableMatches = content.match(/\|.*\|.*\|/g);
    if (tableMatches && tableMatches.length > 2) {
      warnings.push('Potential table structure detected and filtered');
      filteredContent = this.filterContent(filteredContent);
    }

    return {
      isValid: warnings.length === 0,
      filteredContent,
      warnings
    };
  }

  /**
   * Add custom forbidden pattern
   */
  addForbiddenPattern(pattern: RegExp): void {
    ContentFilter.FORBIDDEN_PATTERNS.push(pattern);
  }

  /**
   * Add custom forbidden keyword
   */
  addForbiddenKeyword(keyword: string): void {
    ContentFilter.FORBIDDEN_KEYWORDS.push(keyword.toLowerCase());
  }
}

// Export singleton instance
export const contentFilter = ContentFilter.getInstance();
